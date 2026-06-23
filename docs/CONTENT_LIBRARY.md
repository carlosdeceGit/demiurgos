# Biblioteca de contenidos — decisiones técnicas y configuración

> Funcionalidad añadida en la rama `claude/beautiful-galileo-voqn1l`.
> Permite a cada usuario subir/sincronizar contenido, convertirlo a **Markdown
> limpio** (la representación principal para los modelos de IA) y gestionarlo.

## 1. Resumen

`/library` es una nueva sección (riel izquierdo → "Biblioteca", antes "pronto").
El usuario puede:

- **Subir** archivos (`.md`, `.txt`, `.html`, imágenes `.jpg/.png` con OCR; y
  `.pdf/.docx/.rtf/.odt` reconocidos con punto de integración).
- **Convertir** automáticamente a Markdown (validación, normalización, HTML→MD,
  OCR por modelo de visión).
- **Consultar** la biblioteca: buscador, filtros por estado/origen, detalle con el
  Markdown, edición a mano, reprocesado y borrado.
- **Conectar Google Drive** (registro de carpeta) y **"Sincronizar ahora"** con
  dedupe e historial de sincronización.

Todo respeta la identidad "dark esmeralda" (tokens semánticos, serif para
titulares, acento verde) y RLS por usuario.

## 2. Modelo de datos (migración `0006_content_library.sql`)

Tres tablas nuevas, todas con RLS `auth.uid() = user_id` (mismo patrón que el
resto del esquema). No se toca ni elimina ninguna tabla existente; `uploads`
(Hito 2) queda intacta — la biblioteca es una capa distinta y más rica.

- **`content_library`** — una fila por pieza. Campos clave: `markdown_content`
  (representación principal), `markdown_size`, `content_hash` (dedupe/cambios),
  metadata de origen (`source_type`, `source_id`, `provider_file_id`,
  `provider_modified_at`, `source_url`), `status`
  (`pending|processing|completed|failed|needs_review|synced`), `conversion_tool`,
  `conversion_error`, `metadata_json` (libre, para futuro RAG), `tags`.
  Índice único parcial `(source_id, provider_file_id)` → evita duplicados al
  sincronizar.
- **`content_sources`** — carpetas externas (Google Drive): `provider_folder_id`,
  `provider_folder_name`, `sync_status`, `last_sync_at`. **No** guarda tokens en
  claro (`token_ref` es solo una referencia; el refresh token, si se persiste,
  debe ir cifrado / Supabase Vault).
- **`content_sync_logs`** — traza de cada sincronización (visible al usuario):
  `files_found/imported/updated/failed`, `status`, `error_log`.

### Por qué el Markdown va en la BD y no archivos pesados

El objetivo es alimentar modelos de IA: el Markdown limpio es ligero, consultable
y directamente útil para RAG/embeddings. Por eso es la fuente principal y vive en
Postgres. **No** almacenamos binarios grandes. El original solo se conserva de
forma **opcional** en Supabase Storage (bucket privado `library-originals`)
cuando hace falta reprocesar (p. ej. re-OCR de una imagen). Retención sugerida:
borrar el original al confirmar la conversión, o a los N días. Hoy la subida
manual **no** sube el original por defecto (se convierte al vuelo); el reproceso
desde Storage queda soportado si en el futuro se activa esa subida.

## 3. Conversión a Markdown (`lib/library/convert.ts`)

Funciones puras, sin red, testeadas (`tests/library-convert.test.ts`):

| Formato | Herramienta | Resultado |
|---|---|---|
| `.md` | `markdown-validate` | valida (no vacío) + limpia |
| `.txt` | `txt-normalize` | normaliza a Markdown conservando párrafos |
| `.html/.htm` | `html-to-md` | conversor ligero propio (headings, **bold**, *italic*, links, listas, blockquote, código) |
| `.jpg/.png/...` | `ocr-vision` | OCR vía modelo de visión (ver §4) |
| `.pdf/.docx/.rtf/.odt` | — | `needs_review` con mensaje claro (punto de integración) |

Reglas: no inventar contenido, no resumir, preservar el original, limpiar ruido
(espacios, líneas en blanco repetidas). `deriveTitle` saca el título del primer
encabezado/línea. `contentHash` (sha256) detecta cambios y duplicados.

### Asincronía

La conversión de texto es instantánea y se hace en la ruta de subida. La OCR es
una sola llamada al modelo (con `maxDuration` ampliado). No hay worker en el
stack actual; para lotes grandes o formatos pesados, el **punto de extensión** es
encolar y procesar en background (Railway worker, ya previsto en el plan), o un
Edge Function. La UI ya contempla estados `processing`.

## 4. OCR de imágenes (`lib/library/ocr.ts`)

**Reutiliza la capa de IA existente** (Vercel AI Gateway → modelo de visión
Claude). No añade dependencias ni un servicio OCR aparte. Modelo configurable con
`LIBRARY_OCR_MODEL` (por defecto `anthropic/claude-sonnet-4.6`). Si no hay
`AI_GATEWAY_API_KEY`, la imagen se guarda como `needs_review` con mensaje claro.

Punto de integración: para cambiar a un OCR clásico (Google Vision, Tesseract,
Textract) basta sustituir el cuerpo de `ocrImageToMarkdown`; el contrato de
salida (`ConversionOutcome`) no cambia.

## 5. Google Drive — OAuth por usuario (`lib/library/drive.ts`)

**Cada usuario conecta su propia cuenta de Drive** y elige una carpeta; la
conexión vive en su fila de `content_sources` (con `user_id` y RLS). El flujo
está **implementado de extremo a extremo**; solo faltan las credenciales de
Google para activarlo en producción.

Flujo completo:
1. **Conectar** → `GET /api/library/oauth/start`: genera un `state` (CSRF en
   cookie httpOnly) y redirige al consent de Google
   (`access_type=offline` + `prompt=consent` → garantiza refresh token; scope
   mínimo `drive.readonly` + `userinfo.email`).
2. **Callback** → `GET /api/library/oauth/callback`: valida el `state`, canjea el
   código por tokens, obtiene el email de la cuenta, **cifra el refresh token**
   (AES-256-GCM, `lib/library/crypto.ts`, clave de `LIBRARY_TOKEN_SECRET`) y crea
   la fila de `content_sources` (`sync_status=connected`, carpeta pendiente).
   Nunca se guarda el token en claro.
3. **Elegir carpeta** → `GET /api/library/sources/[id]/folders` lista las carpetas
   de Drive del usuario; `PATCH /api/library/sources/[id]` fija la elegida.
4. **Sincronizar** → `POST /api/library/sync`: `getDriveAccessToken` descifra el
   refresh token y lo canjea por un access token fresco; luego lista, detecta
   nuevos/modificados (`provider_file_id` + `modifiedTime`), descarga, convierte,
   hace upsert con dedupe y registra en `content_sync_logs`. Los Google Docs se
   exportan a texto; el resto se descarga tal cual.
5. **Desconectar** → `DELETE /api/library/sources?id=`: borra la conexión (y su
   token cifrado); el contenido ya importado se conserva.

Sin credenciales, `getDriveAccessToken` lanza `DriveNotConfiguredError` y la UI
lo comunica con claridad; la app **no** se rompe.

### Cómo activarlo (solo añadir credenciales)

1. En **Google Cloud Console**: proyecto → habilita **Google Drive API** →
   credenciales **OAuth 2.0** (tipo *Web application*). Scopes:
   `drive.readonly` y `userinfo.email`. En *Authorized redirect URIs* añade
   `https://demiurgos.vercel.app/api/library/oauth/callback`.
2. Variables de entorno en Vercel:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` = `https://demiurgos.vercel.app/api/library/oauth/callback`
   - `LIBRARY_TOKEN_SECRET` = cadena aleatoria ≥16 chars (cifra los refresh tokens)
   - `NEXT_PUBLIC_SITE_URL` = `https://demiurgos.vercel.app` (para los redirects)
3. (Si la app está en modo *Testing* en Google) añade los emails de prueba en la
   pantalla de consentimiento, o publícala.
4. Listo: cada usuario verá «Conectar Google Drive», autorizará su cuenta y
   elegirá su carpeta. No hace falta tocar código.

## 6. Rutas y UI

API (`app/api/library/`):
- `POST /upload` — subida multipart + conversión + insert.
- `GET|PATCH|DELETE /[id]` — detalle (con markdown), editar (título/tags/MD),
  borrar.
- `POST /[id]/reprocess` — reprocesar (desde Storage si hay original, si no
  re-normaliza el MD).
- `POST /sources` / `DELETE /sources?id=` — conectar/desconectar carpeta Drive.
- `POST /sync` — "Sincronizar ahora".

UI (`app/library/page.tsx` + `components/library/`):
- `library-view.tsx` — drag&drop, progreso, buscador, filtros, lista, estados
  vacíos.
- `content-detail.tsx` — drawer con el Markdown, edición, reprocesar, eliminar.
- `drive-panel.tsx` — conectar carpeta, sincronizar, historial.
- `status-badge.tsx` — estados con color/icono de marca.

## 7. Validaciones y seguridad

- **Formatos**: extensión reconocida; otros → 415 con mensaje.
- **Tamaño**: máx. 10 MB/archivo (`MAX_FILE_BYTES`), vacío → 400.
- **Permisos/RLS**: todas las tablas con policy `auth.uid() = user_id`; las rutas
  usan el cliente de servidor (sesión en cookies) → cada usuario solo ve lo suyo.
- **Errores**: la conversión nunca rompe la app; los fallos se guardan como
  `failed`/`needs_review` con `conversion_error` legible.
- **Secretos**: no se guardan tokens OAuth en claro; OCR/Drive gated por env.

## 8. Variables de entorno

| Variable | Necesaria para | Notas |
|---|---|---|
| `AI_GATEWAY_API_KEY` | OCR de imágenes | ya existe en el proyecto |
| `LIBRARY_OCR_MODEL` | OCR (opcional) | default `anthropic/claude-sonnet-4.6` |
| `GOOGLE_CLIENT_ID` | Google Drive (OAuth por usuario) | pendiente de configurar |
| `GOOGLE_CLIENT_SECRET` | Google Drive | pendiente |
| `GOOGLE_REDIRECT_URI` | Google Drive | `…/api/library/oauth/callback` |
| `LIBRARY_TOKEN_SECRET` | Cifrado del refresh token de Drive | ≥16 chars aleatorios |
| `NEXT_PUBLIC_SITE_URL` | Redirects del OAuth | ya existe en el proyecto |

## 9. Configuración de Supabase

1. Aplicar la migración `supabase/migrations/0006_content_library.sql` (vía MCP
   `apply_migration` o `supabase db push`).
2. (Opcional, solo si se activa la conservación de originales) crear un bucket
   **privado** `library-originals` con políticas RLS por usuario
   (`storage.objects` filtrando por `auth.uid()` en el primer segmento del path).

## 10. Cómo probarlo

1. `npm run build && npm run lint && npm run typecheck && npm run test` (verde).
2. Aplicar la migración. Entrar con sesión → `/library`.
3. Subir un `.md` y un `.txt` → aparecen como **Convertido**.
4. Subir un `.html` → se convierte a Markdown.
5. Subir una imagen `.jpg` con texto → OCR (si hay `AI_GATEWAY_API_KEY`).
6. Subir un `.pdf` → queda **Requiere revisión** con mensaje claro.
7. Abrir el detalle, editar el Markdown, guardar, reprocesar, eliminar.
8. "Conectar carpeta" de Drive y "Sincronizar ahora" → muestra el aviso de
   configuración pendiente y registra el intento en el historial.

## 11. Extensibilidad

- Nuevos formatos: añadir la extensión a `types.ts` y un caso en
  `classifyExtension`/`convertText` (o un servicio externo para binarios).
- RAG/embeddings: `metadata_json` y `content_hash` ya están listos; el Markdown
  limpio en BD es la entrada natural para chunking + pgvector (ya habilitado).
