# BRIEF DE DISEÑO — Demiurgos (fuente de verdad compartida)

> Lee esto entero antes de generar nada. Todos los entregables HTML deben usar
> EXACTAMENTE estos tokens, fuentes y principios para que las pantallas sean
> coherentes entre sí.

## Qué es Demiurgos
Director creativo personal para marca personal en redes. No genera posts a lo
loco: aprende quién eres (perfil), cruza eso con cómo funciona cada red
(conocimiento del ecosistema) y con señales frescas, y decide QUÉ publicar,
cuándo y POR QUÉ. Persona del producto: culto, con criterio, anti-humo, directo.
Tagline: "el artesano que da forma al mundo a partir del caos".

Capas de datos (para mapear la UI):
- Perfil (instancia del usuario): posicionamiento, pilares temáticos (3-5),
  audiencia, voz y tono (reglas duras), datos tácitos, objetivos, plataformas
  activas, referentes.
- Conocimiento del ecosistema: 6 redes (LinkedIn, YouTube, TikTok, Instagram, X,
  Substack), neutral y compartido.
- Señales: cosas frescas que el usuario inyecta (artículos, ideas, posts que le
  molaron) por chat o subiendo archivos.
- Mensajes: conversación con el Director, persistente.
- Propuestas, uploads (hitos posteriores; en la UI se muestran como secciones).

## Referencia de producto: Blotato
La app se imagina como Blotato: por un lado el CHAT con el director, por otro un
ESPACIO DE TRABAJO tipo carpeta/biblioteca donde subes cosas, guardas ideas, le
mandas material interesante al chat. Onboarding tipo formulario por secciones con
una cabecera editorial y un CTA verde en píldora.

## Idioma
TODO en español de España. Tono cercano, claro, sin postureo.

## SISTEMA DE DISEÑO (obligatorio)

### Tipografía (cargar de Google Fonts)
- Sans (UI, texto): "Geist", system-ui, sans-serif.
- Serif editorial (titulares grandes y palabra-acento en cursiva): "Instrument Serif", Georgia, serif.
- Mono (datos, chips técnicos, opcional): "Geist Mono", ui-monospace, monospace.
Los titulares hero combinan sans bold + una palabra clave en serif itálica
(ej.: "Hagamos que cada post sea *tuyo*", con "tuyo" en Instrument Serif italic).

### Tokens CSS (pega tal cual en :root, y el bloque .dark)
```css
:root{
  --bg:#faf9f7; --surface:#ffffff; --surface-2:#f5f4f1;
  --ink:#1c1917; --ink-soft:#44403c; --muted:#78716c; --faint:#a8a29e;
  --border:#e7e5e4; --border-strong:#d6d3d1;
  --brand:#1c1917;                 /* primario casi-tinta (botones oscuros) */
  --accent:#0f9d6b; --accent-strong:#0b7d55; /* verde Demiurgos (CTA principal) */
  --accent-soft:#e6f5ee;
  --violet:#6d5ef0; --violet-soft:#eceaff;   /* secundario para acentos/IA */
  --amber:#d9930b;                 /* avisos suaves / "por qué" */
  --radius:14px; --radius-sm:9px; --radius-pill:999px;
  --shadow-sm:0 1px 2px rgba(28,25,23,.06);
  --shadow:0 8px 30px rgba(28,25,23,.08);
  --ring:0 0 0 3px rgba(15,157,107,.25);
}
.dark{
  --bg:#0f0e0d; --surface:#1a1917; --surface-2:#232120;
  --ink:#f5f4f1; --ink-soft:#d6d3d1; --muted:#a8a29e; --faint:#78716c;
  --border:#2c2a28; --border-strong:#3a3735;
  --brand:#f5f4f1; --accent:#16b87f; --accent-strong:#0f9d6b; --accent-soft:#10241c;
  --violet:#8b7dff; --violet-soft:#1b1830; --amber:#e0a83b;
  --shadow-sm:0 1px 2px rgba(0,0,0,.4); --shadow:0 10px 40px rgba(0,0,0,.5);
}
```
- Fondos de app en `--bg`; tarjetas/paneles en `--surface`; rieles laterales en `--surface-2`.
- CTA principal: fondo `--accent` (gradiente sutil a `--accent-strong`), texto blanco, forma píldora, sombra `--shadow`.
- Botón secundario: borde `--border-strong`, fondo `--surface`, texto `--ink`.
- Acentos de "IA / Director": usar `--violet`.
- Espaciado base 4px. Tarjetas radius 14, inputs 9, botones píldora.
- Tipografía: body 15px/1.55, titulares con tracking ligeramente negativo.
- Soporta light y dark (incluye un toggle visible). Accesible: foco visible (`--ring`), contraste AA.

### Iconos
Usa SVG inline (estilo Lucide, stroke 1.5–2, currentColor). Nada de librerías externas.

### Calidad
HTML5 semántico, responsive (desktop primero, pero que no se rompa en móvil),
self-contained (un solo .html con `<style>` inline; solo se permite el `<link>`
de Google Fonts). Nada de frameworks ni JS de build. JS mínimo solo para el
toggle de tema y tabs si hace falta. Contenido de ejemplo realista (no lorem):
usa el perfil de Carlos Delgado (emprendedor, ecosistema emprendedor español,
voz anti-humo, pilares: criterio del ecosistema / lecciones de fundador / IA
aplicada; plataformas activas LinkedIn, YouTube, Substack) como instancia de
ejemplo ILUSTRATIVA. El conocimiento de redes ejemplo: en LinkedIn rinden
carruseles/documentos y los "saves"; martes-jueves; nada de enlaces en el cuerpo.
