# Demiurgos — Rediseño de la UI (chat + espacio de trabajo)

> Entregable de diseño: report + esquema HTML navegable.
> Archivos en `/design`: `index.html` (integración/design-system), `app.html`
> (app principal), `onboarding.html` (alta), `BRIEF.md` (sistema de diseño).
> Cómo verlo: abre `design/index.html` en el navegador (o cada `.html` por separado).

---

## 1. Qué se pidió y cómo se ha resuelto

Querías Demiurgos a nivel personal **como Blotato**: por un lado el **chat** con el
director, por otro un **espacio de trabajo tipo carpeta** donde subes cosas, hablas
con el chat y le mandas material interesante. Y un **onboarding** como el de la
imagen que compartiste. Salida: report + HTML.

Se ha producido con **subagentes en paralelo** sobre un **brief de diseño
compartido** (`BRIEF.md`), para que las pantallas no diverjan:

- **Agente A** → `app.html`: la app principal (chat + contexto + biblioteca).
- **Agente B** → `onboarding.html`: el alta estilo Blotato adaptada a Demiurgos.
- Integración + report + `index.html`: este documento y el lanzador con vista previa.

---

## 2. Decisiones de diseño (el "por qué")

**Metáfora: un estudio, no un chatbot.** Demiurgos no es un generador de posts; es
un director creativo con criterio. La UI lo refleja con un lenguaje **editorial y
de atelier**: neutros cálidos (stone), una tipografía serif (Instrument Serif) en
cursiva para los acentos, y el verde de marca solo para la acción. Evita el look
"app de IA genérica".

**Tres zonas que mapean la arquitectura del producto.** La pantalla principal es un
shell de 3 columnas:

| Zona | Qué es | A qué capa de datos responde |
|---|---|---|
| Riel izquierdo | Navegación: Chat, Biblioteca, Banco de ideas, Propuestas, Perfil | Las secciones del producto |
| Centro | El chat con el Director (streaming, "Por qué ahora") | `messages` + el motor compuesto |
| Riel derecho | "Contexto": perfil activo, plataformas, señales | `profiles` + `ecosystem_knowledge` + `signals` |

El **riel derecho es la pieza diferencial**: hace **visible la memoria** del Director
(lo que tiene cargado), que es justo lo que genera confianza y separa a Demiurgos de
un chat genérico.

**Chat + espacio, dos flujos con el mismo gesto.** Igual que en Blotato, "soltar
archivos" aparece en dos sitios con intención distinta: en el **compositor** del chat
(mandarle algo al Director en el hilo) y en la **Biblioteca** (organizar sin enviar).
Mismo patrón visual, dos significados.

**El criterio se ve.** El bloque **"Por qué ahora"** (borde ámbar) en las respuestas
del Director es la firma visual del producto: cada propuesta cruza perfil + cómo
funciona la red + señal fresca. Es la regla de oro del motor, hecha UI.

**Onboarding sin fricción.** Se replica el patrón de Blotato (scroll lineal por
secciones con cabecera editorial y CTA verde en píldora), pero mapeado al **esquema
de perfil** real (posicionamiento, pilares, audiencia, voz con reglas duras,
plataformas, material de marca). Los placeholders usan datos reales del perfil para
que el usuario sepa qué nivel de detalle se espera. Cierre tranquilizador: "podrás
afinar todo esto luego en una conversación".

---

## 3. Sistema de diseño (resumen; completo en `BRIEF.md`)

- **Color**: neutros cálidos (stone). Acento **verde** `#0f9d6b` (CTA), **violeta**
  `#6d5ef0` (acentos de IA/Director), **ámbar** `#d9930b` (el "por qué"). Light + dark
  completos con toggle persistente.
- **Tipografía**: **Geist** (UI), **Instrument Serif** italic (titulares-acento, ej.
  "cada post *tuyo*"), **Geist Mono** (etiquetas técnicas, "POR QUÉ AHORA").
- **Forma**: radios 14/9 px, **CTA en píldora**, sombras suaves, foco visible verde.
- **Implementación de los mockups**: HTML5 semántico autocontenido, SVG inline estilo
  Lucide, JS mínimo (tema + tabs + auto-resize + drag-over). Sin frameworks.
- Coherente con el stack real: los tokens son trasladables 1:1 a las variables de
  Tailwind/shadcn que ya usa la app.

---

## 4. Esquema HTML final (estructura)

```
design/
├─ index.html         · lanzador + design-system (swatches, tipografía, previews)
├─ app.html           · APP PRINCIPAL
│   ├─ aside.rail-left      (marca · nav · usuario · tema)
│   ├─ main #view-chat      (cabecera Director · stream de mensajes ·
│   │                        bloque "Por qué ahora" · chips · compositor+dropzone)
│   ├─ main #view-library   (buscador · filtros · dropzone · rejilla de tarjetas)
│   └─ aside.rail-right     (Contexto: perfil · plataformas · señales · acciones)
├─ onboarding.html    · ALTA
│   ├─ hero (titular serif "cada post tuyo" + subtítulo)
│   ├─ fila de 4 ejemplos
│   └─ form: Básicos · Posicionamiento · Pilares · Audiencia · Voz ·
│            Plataformas (chips) · Material de marca (2 dropzones) · CTA verde
└─ BRIEF.md           · tokens, fuentes y principios (fuente de verdad)
```

Detalle de `app.html` (3 columnas):

```
┌───────────┬───────────────────────────────┬──────────────────┐
│ rail-left │            CHAT                │   CONTEXTO       │
│ Demiurgos │ Director creativo · GPT-5.5   │ Perfil activo    │
│ + Nueva   │ ┌───────────────────────────┐ │  Carlos Delgado  │
│   conv.   │ │ user: ¿formato LinkedIn?  │ │  pilares (chips) │
│ ▸ Chat    │ │ Director: carrusel/docs,  │ │ Plataformas      │
│ Biblioteca│ │  saves, mar-jue…          │ │  in · yt · sub   │
│ Ideas     │ │ ▟ POR QUÉ AHORA           │ │ Señales (2-3)    │
│ Propuestas│ └───────────────────────────┘ │ Acciones rápidas │
│ Perfil    │ [chips] [textarea ▏ 📎 ➤]     │  Subir · Generar │
│ Carlos ◐  │  ⤓ arrastra archivos aquí     │                  │
└───────────┴───────────────────────────────┴──────────────────┘
```

---

## 5. Responsive y accesibilidad

- **Responsive**: desktop primero. En `app.html` el riel derecho se oculta < 900px
  (en producción iría a un drawer). En `onboarding.html` el grid colapsa a 1 columna
  y los ejemplos pasan a 2×2.
- **Accesibilidad**: roles semánticos (`main`, `aside`, `article`, `region`),
  `aria-label`/`aria-selected`/`aria-pressed`, `aria-live` en el chat, foco visible
  con anillo verde, contraste AA, y respeto a `prefers-color-scheme`.

---

## 6. Cómo llevarlo al Next real (siguientes pasos)

Esto es un **mockup de diseño**, no toca la app desplegada. Para implementarlo:

1. **Tokens**: trasladar las variables de `BRIEF.md` a `app/globals.css` (ya hay base
   shadcn neutral; se añade el acento verde, el violeta y la serif).
2. **Shell de 3 columnas**: nuevo layout para `/chat` con riel izquierdo (nav) y riel
   derecho (Contexto, alimentado por `compose-context` → mismo dato que ve el modelo).
3. **Compositor con adjuntos + Biblioteca**: son funcionalidad del **Hito 2** (uploads
   y análisis). El diseño ya deja el sitio; la lógica llega en ese hito.
4. **Onboarding**: es el **Hito 3** (entrevista por IA). El formulario lineal sirve
   como modo "rápido"; la entrevista conversacional lo complementa.
5. **Fuentes**: añadir Instrument Serif y Geist Mono (Geist ya está) vía `next/font`.

> Importante: el contenido de "Carlos" en los mockups es **ilustrativo** (la instancia
> de dogfooding). El motor sigue siendo genérico; estos HTML son artefactos de diseño
> en `/design`, no código de `/lib` ni `/app`.

---

## 7. Qué quedó fuera (a propósito)

- Banco de ideas y Propuestas: tabs presentes como stub (hitos posteriores).
- Subida real de archivos y validación de formulario: interfaz lista, sin backend.
- Drawer de Contexto en móvil y animaciones de entrada: fuera del alcance del mockup.
