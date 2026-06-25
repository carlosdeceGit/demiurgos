import type {
  DemoCalendarEntry,
  DemoConversation,
  DemoFullProposal,
  DemoIdea,
  DemoLibraryItem,
  DemoProposal,
  DemoSignal,
} from "./types";

// Propuestas de ejemplo. Los textos están redactados a mano (no lorem) para que
// la demo sea creíble: cada "por qué ahora" cruza un pilar del perfil, una señal
// y cómo funciona la red.
export const DEMO_PROPOSALS: DemoProposal[] = [
  // ── Carlos (emprendimiento) ────────────────────────────────
  {
    id: "carlos-1",
    profileId: "carlos",
    platform: "linkedin",
    day: "Martes",
    idea: "Carrusel: «5 cláusulas del pacto de socios que rompen equipos» (con el ángulo del que ha estado en la trinchera)",
    whyNow:
      "Tu pilar de lecciones de fundador + esta semana se habla del cierre de una startup conocida por líos entre socios. En LinkedIn los carruseles/documentos son el formato con más engagement y disparan saves, justo lo que premia el algoritmo en 2026.",
    script:
      "Hook (1ª línea, antes del «ver más»): «He visto romperse más equipos por el pacto de socios que por falta de mercado.»\nDesarrollo: 5 slides, una cláusula por slide (vesting, arrastre, salida, no-compete, decisiones reservadas), cada una con el error real que provoca.\nCierre: «¿Cuál te ha mordido a ti?»",
    slot: "Martes 8:00",
    status: "nueva",
    model: "openai/gpt-5.5",
  },
  {
    id: "carlos-2",
    profileId: "carlos",
    platform: "substack",
    day: "Jueves",
    idea: "Newsletter: el mapa real del ecosistema fuera de Madrid-Barcelona (con 3 fundadores que nadie está mirando)",
    whyNow:
      "Tu wedge es la cobertura nacional de verdad. Substack crece por Notes y recomendaciones: publica la pieza y trocea 2-3 Notes durante la semana para alimentar el descubrimiento.",
    script:
      "Asunto: «El ecosistema no termina en la M-30.»\nCuerpo: 3 fundadores fuera del eje, qué construyen y por qué importan. Cierre con tu opinión, no solo el listado.",
    slot: "Jueves 7:30",
    status: "aceptada",
    model: "openai/gpt-5.5",
  },
  {
    id: "carlos-3",
    profileId: "carlos",
    platform: "youtube",
    day: "Sábado",
    idea: "Cracks: entrevista a un fundador que levantó sin VC, en formato largo + 3 shorts de los mejores momentos",
    whyNow:
      "YouTube desacopló Shorts de long-form: la estrategia híbrida crece ~3x. Los shorts captan audiencia fría y empujan al vídeo largo, tu constructor de autoridad.",
    script:
      "Long-form: 18-22 min, estructura por decisiones clave del fundador.\nShorts: 3 cortes de <60s con el momento más contraintuitivo de la charla.",
    slot: "Sábado 11:00",
    status: "nueva",
    model: "openai/gpt-5.5",
  },

  // ── Lucía (abogada) ───────────────────────────────────────
  {
    id: "lucia-1",
    profileId: "lucia",
    platform: "linkedin",
    day: "Miércoles",
    idea: "Carrusel: «Term sheet en cristiano: las 6 líneas que cambian tu vida como founder»",
    whyNow:
      "Tu pilar de rondas + es temporada de cierres antes de verano. En LinkedIn el contenido educativo tiene 3-5x más alcance y los carruseles maximizan dwell time y saves.",
    script:
      "Hook: «Firmé mi primer term sheet sin entender la mitad. No lo repitas.»\n6 slides: valoración, liquidation preference, antidilución, pool, vesting, control. Cada uno con la traducción a negocio.",
    slot: "Miércoles 8:30",
    status: "nueva",
    model: "openai/gpt-5.5",
  },
  {
    id: "lucia-2",
    profileId: "lucia",
    platform: "substack",
    day: "Lunes",
    idea: "Newsletter: «El caso del cofundador que se fue con el 30%» (anonimizado) y cómo se evita",
    whyNow:
      "Tu pilar de pactos de socios + el storytelling de caso real es lo que más se comparte. En Substack, una pieza con gancho claro alimenta tus Notes toda la semana.",
    script:
      "Asunto: «Se fue a los 8 meses. Con el 30%.»\nCuerpo: la historia, el error (sin vesting), y la cláusula de 3 líneas que lo habría evitado.",
    slot: "Lunes 7:00",
    status: "descartada",
    model: "openai/gpt-5.5",
  },

  // ── Marc (chef) ───────────────────────────────────────────
  {
    id: "marc-1",
    profileId: "marc",
    platform: "instagram",
    day: "Jueves",
    idea: "Reel: «Por qué tu tortilla queda seca» — el punto exacto del cuajado, a cámara lenta",
    whyNow:
      "Tu pilar de técnica explicada + es un debate eterno que genera comentarios. En Reels mandan el watch time y los envíos por DM: un truco accionable es muy «compartible».",
    script:
      "Hook (seg 0-2): «Llevas toda la vida haciéndola mal.»\nDemo: el punto de cuajado a fuego medio, fuera del fuego antes de tiempo.\nCierre: «Guárdalo para el finde.»",
    slot: "Jueves 14:00",
    status: "aceptada",
    model: "openai/gpt-5.5",
  },
  {
    id: "marc-2",
    profileId: "marc",
    platform: "tiktok",
    day: "Domingo",
    idea: "Serie: «Un producto de mercado, 3 platos» — empezando por las alcachofas de temporada",
    whyNow:
      "Tu pilar de producto de temporada + TikTok premia la relevancia de nicho y el completion rate (70%+). Una serie engancha al rewatch y a seguir por el siguiente capítulo.",
    script:
      "Hook: «3 platos, 1 producto, 0 desperdicio.»\nRitmo rápido, 3 mini-recetas en 45s, cada una con el porqué de la técnica.",
    slot: "Domingo 13:00",
    status: "nueva",
    model: "openai/gpt-5.5",
  },

  // ── Ana (fisio) ───────────────────────────────────────────
  {
    id: "ana-1",
    profileId: "ana",
    platform: "instagram",
    day: "Martes",
    idea: "Reel: «El reposo no te va a curar la espalda» — 3 movimientos para empezar hoy",
    whyNow:
      "Tu pilar de ejercicio como medicina + desmontar el mito del reposo genera guardados y envíos. En Reels, pasar del segundo 3 dispara el alcance: el hook tiene que doler.",
    script:
      "Hook: «Si te han dicho que descanses, sigue leyendo.»\n3 movimientos suaves con progresión, explicando por qué el movimiento ayuda.\nCierre: «Empieza por el primero hoy.»",
    slot: "Martes 18:00",
    status: "nueva",
    model: "openai/gpt-5.5",
  },
  {
    id: "ana-2",
    profileId: "ana",
    platform: "youtube",
    day: "Viernes",
    idea: "Short: «¿Crujen tus rodillas? Lo que de verdad significa» (basado en evidencia)",
    whyNow:
      "Tu pilar de mitos + es una duda con muchísima búsqueda. En YouTube los Shorts son motor de descubrimiento y te traen audiencia fría hacia tus vídeos largos.",
    script:
      "Hook (3s): «Que crujan no significa que se rompan.»\nExplicación de 40s, clara y tranquilizadora, con la evidencia en una línea.",
    slot: "Viernes 19:00",
    status: "nueva",
    model: "openai/gpt-5.5",
  },
];

// Señales recientes inyectadas por cada usuario.
export const DEMO_SIGNALS: DemoSignal[] = [
  { id: "s-c1", profileId: "carlos", source: "chat", date: "2026-06-20T10:00:00Z", content: "Artículo sobre el cierre de una startup conocida por conflictos entre socios." },
  { id: "s-c2", profileId: "carlos", source: "upload", date: "2026-06-19T16:00:00Z", content: "Captura de un post de Spicy4Tuna que funcionó muy bien (formato, no tono)." },
  { id: "s-c3", profileId: "carlos", source: "research", date: "2026-06-18T09:00:00Z", content: "LinkedIn confirma que los enlaces en el primer comentario también penalizan en 2026." },

  { id: "s-l1", profileId: "lucia", source: "chat", date: "2026-06-20T11:00:00Z", content: "Founder pregunta por liquidation preference en una ronda puente." },
  { id: "s-l2", profileId: "lucia", source: "upload", date: "2026-06-17T15:00:00Z", content: "Term sheet (anonimizado) con una antidilución agresiva." },
  { id: "s-l3", profileId: "lucia", source: "research", date: "2026-06-16T09:00:00Z", content: "Tendencia: más rondas puente y SAFEs en el mercado español." },

  { id: "s-m1", profileId: "marc", source: "chat", date: "2026-06-20T12:00:00Z", content: "Llegan las primeras alcachofas buenas al mercado." },
  { id: "s-m2", profileId: "marc", source: "upload", date: "2026-06-18T14:00:00Z", content: "Reel de tortilla de otra cuenta con 2M de visitas." },
  { id: "s-m3", profileId: "marc", source: "research", date: "2026-06-15T10:00:00Z", content: "TikTok prioriza relevancia de nicho sobre viral aleatorio en 2026." },

  { id: "s-a1", profileId: "ana", source: "chat", date: "2026-06-20T08:30:00Z", content: "Paciente runner con miedo a correr tras una lesión leve." },
  { id: "s-a2", profileId: "ana", source: "research", date: "2026-06-14T09:00:00Z", content: "Revisión reciente: el ejercicio supera al reposo en lumbalgia inespecífica." },
];

// Una conversación de muestra por perfil (para precargar el chat de la demo).
export const DEMO_CONVERSATIONS: DemoConversation[] = [
  {
    profileId: "carlos",
    messages: [
      { role: "user", content: "¿Qué formato me conviene en LinkedIn esta semana?" },
      {
        role: "assistant",
        content:
          "Carrusel, sin duda. Tu pilar fuerte ahora es «lecciones de fundador» y esta semana hay una señal jugosa: el cierre de esa startup por líos entre socios.\n\nPOR QUÉ AHORA: en LinkedIn los documentos/carruseles son el formato con más engagement y disparan saves, que es la señal que más pesa en 2026. Cruza tu autoridad de fundador con un tema candente y tienes alcance + guardados.\n\nIdea: «5 cláusulas del pacto de socios que rompen equipos». Hook en la primera línea, una cláusula por slide con el error real que provoca, y cierras preguntando cuál les ha mordido. Publícalo martes a las 8:00.",
      },
    ],
  },
  {
    profileId: "lucia",
    messages: [
      { role: "user", content: "Tengo poco tiempo esta semana, ¿qué publico?" },
      {
        role: "assistant",
        content:
          "Una sola pieza buena rinde más que cinco mediocres, así que vamos a por un carrusel en LinkedIn, que es donde está tu audiencia de founders.\n\nPOR QUÉ AHORA: es temporada de cierres antes de verano y el contenido educativo tiene 3-5x más alcance. Un carrusel «Term sheet en cristiano» traduce lo legal a decisiones de negocio, justo tu posicionamiento.\n\nTe dejo 6 slides (valoración, liquidation preference, antidilución, pool, vesting, control). ¿Te lo desarrollo?",
      },
    ],
  },
  {
    profileId: "marc",
    messages: [
      { role: "user", content: "Han llegado alcachofas buenas, ¿hago algo con eso?" },
      {
        role: "assistant",
        content:
          "Sí, y lo aprovechamos para arrancar una serie, que en TikTok engancha al rewatch.\n\nPOR QUÉ AHORA: tu pilar es producto de temporada y TikTok premia la relevancia de nicho y el completion rate por encima del 70%. Una serie «un producto, 3 platos» da continuidad y sube la retención.\n\nEmpezamos por las alcachofas: 3 mini-recetas en 45s, cada una explicando el porqué de la técnica, no solo el paso. ¿Te guiono el primer vídeo?",
      },
    ],
  },
  {
    profileId: "ana",
    messages: [
      { role: "user", content: "Un paciente runner tiene miedo a volver a correr. ¿Contenido?" },
      {
        role: "assistant",
        content:
          "Ese miedo lo comparte muchísima gente, así que es oro para un Reel.\n\nPOR QUÉ AHORA: tu pilar «ejercicio como medicina» + la evidencia reciente de que el movimiento supera al reposo. En Reels, si pasan del segundo 3 el alcance se dispara, así que el hook tiene que tocar el miedo de frente.\n\nIdea: «El reposo no te va a curar» + 3 movimientos para empezar hoy. Cálida pero firme, sin culpabilizar. ¿Te escribo el guion?",
      },
    ],
  },
];

export function proposalsFor(profileId: string): DemoProposal[] {
  return DEMO_PROPOSALS.filter((p) => p.profileId === profileId);
}
export function signalsFor(profileId: string): DemoSignal[] {
  return DEMO_SIGNALS.filter((s) => s.profileId === profileId);
}
export function conversationFor(profileId: string): DemoConversation | undefined {
  return DEMO_CONVERSATIONS.find((c) => c.profileId === profileId);
}

// ── Propuestas enriquecidas (vista /propuestas) ────────────────
// Formato compatible con ProposalRow del componente real.
export const DEMO_FULL_PROPOSALS: DemoFullProposal[] = [
  // ── Carlos ────────────────────────────────────────────────────
  {
    id: "fp-carlos-1",
    profileId: "carlos",
    platform: "linkedin",
    idea: "Carrusel: «5 cláusulas del pacto de socios que rompen equipos»",
    why_now: "Tu pilar de lecciones de fundador + esta semana se habla del cierre de una startup conocida por líos entre socios. En LinkedIn los carruseles son el formato con más engagement y disparan saves.",
    script: "Hook (1ª línea): «He visto romperse más equipos por el pacto de socios que por falta de mercado.»\n5 slides, una cláusula por slide (vesting, arrastre, salida, no-compete, decisiones reservadas), cada una con el error real que provoca.\nCierre: «¿Cuál te ha mordido a ti?»",
    image_prompt: "Dark background, legal document with emerald highlights, 5 clauses highlighted, minimal design",
    suggested_slot: "Martes 8:00",
    status: "nueva",
    expires_at: "2026-06-29T00:00:00Z",
    content_type: "carousel",
    content_category: "educational",
    based_on: { hook: "He visto romperse más equipos por el pacto de socios que por falta de mercado.", format: "carousel" },
    created_at: "2026-06-22T10:00:00Z",
  },
  {
    id: "fp-carlos-2",
    profileId: "carlos",
    platform: "substack",
    idea: "Newsletter: el mapa real del ecosistema fuera de Madrid-Barcelona",
    why_now: "Tu wedge es la cobertura nacional de verdad. Substack crece por Notes y recomendaciones: publica la pieza y trocea 2-3 Notes durante la semana.",
    script: "Asunto: «El ecosistema no termina en la M-30.»\n3 fundadores fuera del eje, qué construyen y por qué importan. Cierre con tu opinión, no solo el listado.",
    image_prompt: null,
    suggested_slot: "Jueves 7:30",
    status: "liked",
    expires_at: "2026-07-02T00:00:00Z",
    content_type: "post_text",
    content_category: "informative",
    based_on: { hook: "El ecosistema no termina en la M-30.", caption: "La cobertura que nadie hace porque todos miran al eje." },
    created_at: "2026-06-22T10:05:00Z",
  },
  {
    id: "fp-carlos-3",
    profileId: "carlos",
    platform: "youtube",
    idea: "Entrevista a un fundador que levantó sin VC, en formato largo + 3 shorts",
    why_now: "YouTube desacopló Shorts de long-form: la estrategia híbrida crece ~3x. Los shorts captan audiencia fría y empujan al vídeo largo.",
    script: "Long-form: 18-22 min, estructura por decisiones clave del fundador.\nShorts: 3 cortes de <60s con el momento más contraintuitivo de la charla.",
    image_prompt: "Two founders talking, dark studio setup, emerald accent lighting, authentic documentary feel",
    suggested_slot: "Sábado 11:00",
    status: "nueva",
    expires_at: "2026-07-05T00:00:00Z",
    content_type: "video_script",
    content_category: "informative",
    based_on: { hook: "Levantó 1,2M sin hablar con un solo VC. Aquí cómo lo hizo.", format: "video_script" },
    created_at: "2026-06-22T10:10:00Z",
  },
  {
    id: "fp-carlos-4",
    profileId: "carlos",
    platform: "linkedin",
    idea: "Post: «Lo que aprendí cerrando una startup»",
    why_now: "El cierre de startups es tendencia esta semana. Tu credencial de fundador con cicatrices es el diferencial que ningun analista puede replicar.",
    script: "Formato largo, primera persona. 3 lecciones concretas con el error detrás de cada una. Cierre honesto: qué harías distinto. Sin postureo ni redención fácil.",
    image_prompt: null,
    suggested_slot: "Lunes 7:30",
    status: "ejecutada",
    expires_at: null,
    content_type: "post_text",
    content_category: "educational",
    based_on: { hook: "Cerré una startup. Aquí lo que no te cuentan.", caption: "El post que me costó escribir más que cualquier pitch deck." },
    created_at: "2026-06-15T09:00:00Z",
  },
  // ── Lucía ──────────────────────────────────────────────────────
  {
    id: "fp-lucia-1",
    profileId: "lucia",
    platform: "linkedin",
    idea: "Carrusel: «Term sheet en cristiano — las 6 líneas que cambian tu vida como founder»",
    why_now: "Tu pilar de rondas + es temporada de cierres antes de verano. En LinkedIn el contenido educativo tiene 3-5x más alcance y los carruseles maximizan dwell time.",
    script: "Hook: «Firmé mi primer term sheet sin entender la mitad. No lo repitas.»\n6 slides: valoración, liquidation preference, antidilución, pool, vesting, control. Cada uno con la traducción a negocio.",
    image_prompt: "Legal document transformed into simple infographic, dark background, emerald highlights on key terms",
    suggested_slot: "Miércoles 8:30",
    status: "nueva",
    expires_at: "2026-07-01T00:00:00Z",
    content_type: "carousel",
    content_category: "educational",
    based_on: { hook: "Firmé mi primer term sheet sin entender la mitad. No lo repitas.", format: "carousel" },
    created_at: "2026-06-22T11:00:00Z",
  },
  {
    id: "fp-lucia-2",
    profileId: "lucia",
    platform: "substack",
    idea: "Newsletter: «El caso del cofundador que se fue con el 30%» (anonimizado)",
    why_now: "Tu pilar de pactos de socios + el storytelling de caso real es lo que más se comparte. En Substack, una pieza con gancho claro alimenta tus Notes toda la semana.",
    script: "Asunto: «Se fue a los 8 meses. Con el 30%.»\nLa historia, el error (sin vesting), y la cláusula de 3 líneas que lo habría evitado.",
    image_prompt: null,
    suggested_slot: "Lunes 7:00",
    status: "liked",
    expires_at: "2026-06-30T00:00:00Z",
    content_type: "post_text",
    content_category: "educational",
    based_on: { hook: "Se fue a los 8 meses. Con el 30%.", caption: "La cláusula de 3 líneas que lo habría evitado." },
    created_at: "2026-06-22T11:05:00Z",
  },
  {
    id: "fp-lucia-3",
    profileId: "lucia",
    platform: "instagram",
    idea: "Carrusel: «3 errores que vi esta semana en pactos de socios»",
    why_now: "Instagram alcanza a founders más jóvenes y primeros emprendedores que aún no siguen abogados en LinkedIn. El formato ágil te da visibilidad distinta.",
    script: "Slide 1: «Esta semana vi 3 errores que van a costar muy caro.»\nSlide 2-4: Un error por slide, con el coste real y la alternativa. Cierre con CTA a la newsletter.",
    image_prompt: "Minimalist legal graphic, dark background, three warning signs, emerald accent",
    suggested_slot: "Viernes 12:00",
    status: "nueva",
    expires_at: "2026-07-03T00:00:00Z",
    content_type: "carousel",
    content_category: "educational",
    based_on: { hook: "Esta semana vi 3 errores que van a costar muy caro.", format: "carousel" },
    created_at: "2026-06-22T11:10:00Z",
  },
  // ── Marc ───────────────────────────────────────────────────────
  {
    id: "fp-marc-1",
    profileId: "marc",
    platform: "instagram",
    idea: "Reel: «Por qué tu tortilla queda seca» — el punto exacto del cuajado",
    why_now: "Tu pilar de técnica explicada + es un debate eterno que genera comentarios. En Reels mandan el watch time y los envíos por DM: un truco accionable es muy «compartible».",
    script: "Hook (seg 0-2): «Llevas toda la vida haciéndola mal.»\nDemo: el punto de cuajado a fuego medio, fuera del fuego antes de tiempo.\nCierre: «Guárdalo para el finde.»",
    image_prompt: "Close-up of perfectly cuajada tortilla, steam, dark pan, moody kitchen lighting",
    suggested_slot: "Jueves 14:00",
    status: "liked",
    expires_at: "2026-07-03T00:00:00Z",
    content_type: "video_script",
    content_category: "educational",
    based_on: { hook: "Llevas toda la vida haciéndola mal.", format: "video_script" },
    created_at: "2026-06-22T12:00:00Z",
  },
  {
    id: "fp-marc-2",
    profileId: "marc",
    platform: "tiktok",
    idea: "Serie: «Un producto de mercado, 3 platos» — empezando por las alcachofas",
    why_now: "Tu pilar de producto de temporada + TikTok premia la relevancia de nicho y el completion rate. Una serie engancha al rewatch y a seguir por el siguiente capítulo.",
    script: "Hook: «3 platos, 1 producto, 0 desperdicio.»\nRitmo rápido, 3 mini-recetas en 45s, cada una con el porqué de la técnica.",
    image_prompt: "Fresh artichokes on dark slate, market scene, rustic and moody",
    suggested_slot: "Domingo 13:00",
    status: "nueva",
    expires_at: "2026-06-29T00:00:00Z",
    content_type: "video_script",
    content_category: "educational",
    based_on: { hook: "3 platos, 1 producto, 0 desperdicio.", format: "video_script" },
    created_at: "2026-06-22T12:05:00Z",
  },
  {
    id: "fp-marc-3",
    profileId: "marc",
    platform: "youtube",
    idea: "Vídeo largo: «Un día en el mercado de La Boqueria — así compro yo»",
    why_now: "YouTube long-form es tu constructor de autoridad. El formato «día conmigo» humaniza y enseña simultáneamente, con alto retention rate.",
    script: "Recorrido real por el mercado, 12-15 min. Muestras cómo evalúas el producto: color, olor, temporada, proveedor de confianza. 3 compras de la sesión y qué vas a hacer con cada una.",
    image_prompt: "Vibrant market stall, chef selecting produce, authentic documentary look",
    suggested_slot: "Sábado 10:00",
    status: "nueva",
    expires_at: "2026-07-05T00:00:00Z",
    content_type: "video_script",
    content_category: "informative",
    based_on: { hook: "Aquí cómo compro yo cuando nadie me graba.", format: "video_script" },
    created_at: "2026-06-22T12:10:00Z",
  },
  // ── Ana ────────────────────────────────────────────────────────
  {
    id: "fp-ana-1",
    profileId: "ana",
    platform: "instagram",
    idea: "Reel: «El reposo no te va a curar la espalda» — 3 movimientos para empezar hoy",
    why_now: "Tu pilar de ejercicio como medicina + desmontar el mito del reposo genera guardados y envíos. En Reels, pasar del segundo 3 dispara el alcance.",
    script: "Hook: «Si te han dicho que descanses, sigue leyendo.»\n3 movimientos suaves con progresión, explicando por qué el movimiento ayuda.\nCierre: «Empieza por el primero hoy.»",
    image_prompt: "Person gently stretching, minimal studio, dark background, calm and encouraging",
    suggested_slot: "Martes 18:00",
    status: "nueva",
    expires_at: "2026-06-30T00:00:00Z",
    content_type: "video_script",
    content_category: "educational",
    based_on: { hook: "Si te han dicho que descanses, sigue leyendo.", format: "video_script" },
    created_at: "2026-06-22T13:00:00Z",
  },
  {
    id: "fp-ana-2",
    profileId: "ana",
    platform: "youtube",
    idea: "Short: «¿Crujen tus rodillas? Lo que de verdad significa»",
    why_now: "Tu pilar de mitos + es una duda con muchísima búsqueda. En YouTube los Shorts son motor de descubrimiento.",
    script: "Hook (3s): «Que crujan no significa que se rompan.»\nExplicación de 40s, clara y tranquilizadora, con la evidencia en una línea.",
    image_prompt: "Close-up of knee joint diagram, medical illustration style, dark background",
    suggested_slot: "Viernes 19:00",
    status: "nueva",
    expires_at: "2026-07-04T00:00:00Z",
    content_type: "video_script",
    content_category: "educational",
    based_on: { hook: "Que crujan no significa que se rompan.", format: "video_script" },
    created_at: "2026-06-22T13:05:00Z",
  },
  {
    id: "fp-ana-3",
    profileId: "ana",
    platform: "tiktok",
    idea: "Serie: «Mitos de la fisio que tu abuela repite» — Episodio 1: el frío y el calor",
    why_now: "TikTok premia las series con fidelización de seguidores. El formato de desmontaje de mitos tiene altísimo engagement y shares.",
    script: "Hook: «Tu abuela te miente. Con buena intención, pero te miente.»\nMito: «Pon hielo siempre que te duele.» Realidad: depende de la fase, el tipo y el tejido.\nCierre: «Episodio 2 mañana.»",
    image_prompt: null,
    suggested_slot: "Jueves 18:30",
    status: "liked",
    expires_at: "2026-07-03T00:00:00Z",
    content_type: "video_script",
    content_category: "educational",
    based_on: { hook: "Tu abuela te miente. Con buena intención, pero te miente.", format: "video_script" },
    created_at: "2026-06-22T13:10:00Z",
  },
];

// ── Ideas (banco de ideas) ────────────────────────────────────
export const DEMO_IDEAS: DemoIdea[] = [
  // ── Carlos — generación 1 (semana pasada) ────────────────────
  { id: "i-c1-1", profileId: "carlos", generation_id: "gen-carlos-1", platform: "linkedin", content_type: "carousel", status: "guardada", created_at: "2026-06-15T09:00:00Z", idea: "«El error de contratar por currículum en una startup de <10 personas»", why_interesting: "La mayoría de los fundadores cometen este error en la fase de cero a uno. Tu experiencia real lo convierte en autoridad, no en consejo genérico." },
  { id: "i-c1-2", profileId: "carlos", generation_id: "gen-carlos-1", platform: "linkedin", content_type: "post_text", status: "nueva", created_at: "2026-06-15T09:01:00Z", idea: "«Por qué la mayoría de los MVP no son MVP: el error de producto más caro»", why_interesting: "El término 'MVP' ha sido tan mal usado que genera confusión. Un post que lo redefine con criterio puede tener mucho alcance orgánico." },
  { id: "i-c1-3", profileId: "carlos", generation_id: "gen-carlos-1", platform: "substack", content_type: "post_text", status: "guardada", created_at: "2026-06-15T09:02:00Z", idea: "«3 startups fuera del eje Madrid-Barcelona que nadie está mirando»", why_interesting: "Tu diferencial es la cobertura nacional real. Un artículo de descubrimiento posiciona tu newsletter como fuente primaria, no como agregador." },
  { id: "i-c1-4", profileId: "carlos", generation_id: "gen-carlos-1", platform: "youtube", content_type: "video_script", status: "nueva", created_at: "2026-06-15T09:03:00Z", idea: "«El momento exacto para levantar ronda (y cuándo no hacerlo)»", why_interesting: "La temporalidad del fundraising es una de las preguntas más frecuentes. Un vídeo largo con casos reales puede convertirse en referencia." },
  { id: "i-c1-5", profileId: "carlos", generation_id: "gen-carlos-1", platform: "linkedin", content_type: "carousel", status: "descartada", created_at: "2026-06-15T09:04:00Z", idea: "«IA para operaciones: 5 herramientas que uso cada semana»", why_interesting: "El tema de IA es relevante pero saturado. Funciona si va muy ligado a casos reales tuyos, no como lista genérica." },
  { id: "i-c1-6", profileId: "carlos", generation_id: "gen-carlos-1", platform: "substack", content_type: "post_text", status: "nueva", created_at: "2026-06-15T09:05:00Z", idea: "«El problema con los aceleradores de startups que nadie dice en voz alta»", why_interesting: "Contenido con criterio propio sobre el ecosistema. Genera debate, comentarios y shares entre fundadores." },
  // ── Carlos — generación 2 (esta semana) ──────────────────────
  { id: "i-c2-1", profileId: "carlos", generation_id: "gen-carlos-2", platform: "linkedin", content_type: "carousel", status: "guardada", created_at: "2026-06-22T09:00:00Z", idea: "«Cómo saber si un co-fundador es el adecuado antes de firmar nada»", why_interesting: "La relación entre cofundadores es la causa #1 de cierre de startups. Tu pilar de lecciones de fundador + la señal de la semana lo hacen muy oportuno." },
  { id: "i-c2-2", profileId: "carlos", generation_id: "gen-carlos-2", platform: "linkedin", content_type: "post_text", status: "nueva", created_at: "2026-06-22T09:01:00Z", idea: "«Bootstrappers vs VC-backed: lo que los números no te dicen»", why_interesting: "El debate está activo tras el cierre de startups VC-backed. Tu perspectiva de alguien que ha vivido ambos lados tiene mucho peso." },
  { id: "i-c2-3", profileId: "carlos", generation_id: "gen-carlos-2", platform: "youtube", content_type: "video_script", status: "nueva", created_at: "2026-06-22T09:02:00Z", idea: "«Semana en la vida de un founder: lo que no ves en Twitter»", why_interesting: "El formato 'day in the life' funciona muy bien en YouTube. La honestidad sobre lo que no se muestra es el gancho diferenciador." },
  { id: "i-c2-4", profileId: "carlos", generation_id: "gen-carlos-2", platform: "substack", content_type: "post_text", status: "nueva", created_at: "2026-06-22T09:03:00Z", idea: "«El ecosistema emprendedor español en 2026: radiografía honesta»", why_interesting: "Un análisis trimestral del ecosistema puede convertirse en la pieza de referencia del sector. Encaja perfectamente con tu posicionamiento." },

  // ── Lucía — generación 1 ──────────────────────────────────────
  { id: "i-l1-1", profileId: "lucia", generation_id: "gen-lucia-1", platform: "linkedin", content_type: "carousel", status: "guardada", created_at: "2026-06-18T10:00:00Z", idea: "«El clausulado de confidencialidad que te protege de verdad»", why_interesting: "Los NDAs mal redactados son papel mojado. Un carrusel desmontando los errores más comunes tiene altísimo valor y save-rate." },
  { id: "i-l1-2", profileId: "lucia", generation_id: "gen-lucia-1", platform: "substack", content_type: "post_text", status: "guardada", created_at: "2026-06-18T10:01:00Z", idea: "«Guía para entender tu propio cap table antes de la Serie A»", why_interesting: "La mayoría de los founders llegan a Serie A sin entender qué pasa con su equity. Una guía práctica es contenido evergreen de alto valor." },
  { id: "i-l1-3", profileId: "lucia", generation_id: "gen-lucia-1", platform: "linkedin", content_type: "post_text", status: "nueva", created_at: "2026-06-18T10:02:00Z", idea: "«Por qué las marcas comerciales se registran tarde (y lo caro que sale)»", why_interesting: "Un error legal muy común que genera problemas cuando la startup ya tiene tracción. Tu pilar de errores que cuestan caro." },
  { id: "i-l1-4", profileId: "lucia", generation_id: "gen-lucia-1", platform: "instagram", content_type: "carousel", status: "nueva", created_at: "2026-06-18T10:03:00Z", idea: "«3 preguntas que debes hacer antes de firmar cualquier contrato»", why_interesting: "Instagram llega a emprendedores más jóvenes y primeras startups. Un carrusel simple y accionable tiene mucho potencial de shares." },
  { id: "i-l1-5", profileId: "lucia", generation_id: "gen-lucia-1", platform: "substack", content_type: "post_text", status: "nueva", created_at: "2026-06-18T10:04:00Z", idea: "«SAFEs vs préstamos convertibles: la diferencia que importa en España»", why_interesting: "El mercado español tiene particularidades legales que los posts anglosajones no cubren. Tu conocimiento local es el diferencial." },

  // ── Marc — generación 1 ───────────────────────────────────────
  { id: "i-m1-1", profileId: "marc", generation_id: "gen-marc-1", platform: "instagram", content_type: "video_script", status: "guardada", created_at: "2026-06-17T11:00:00Z", idea: "«El aceite de oliva que merece la pena gastar (y cómo reconocerlo en el super)»", why_interesting: "Decisión de compra cotidiana con impacto en el resultado del plato. Alto potencial de saves y envíos entre aficionados a la cocina." },
  { id: "i-m1-2", profileId: "marc", generation_id: "gen-marc-1", platform: "tiktok", content_type: "video_script", status: "guardada", created_at: "2026-06-17T11:01:00Z", idea: "«El error que comete todo el mundo al hacer el sofrito»", why_interesting: "El sofrito es la base de la cocina mediterránea. Un vídeo que enseña el porqué del timing y el fuego puede ser muy viral en TikTok." },
  { id: "i-m1-3", profileId: "marc", generation_id: "gen-marc-1", platform: "youtube", content_type: "video_script", status: "nueva", created_at: "2026-06-17T11:02:00Z", idea: "«Guía de setas de temporada: qué buscar, dónde comprar, cómo conservar»", why_interesting: "Contenido de temporada con alto volumen de búsqueda. Tu autoridad de chef lo eleva por encima de los blogs de recetas." },
  { id: "i-m1-4", profileId: "marc", generation_id: "gen-marc-1", platform: "instagram", content_type: "carousel", status: "nueva", created_at: "2026-06-17T11:03:00Z", idea: "«5 técnicas de cocina que separan al aficionado del cocinero serio»", why_interesting: "Aspiracional sin ser elitista: tu voz apasionada y directa es perfecta para este formato. Muy guardable." },
  { id: "i-m1-5", profileId: "marc", generation_id: "gen-marc-1", platform: "tiktok", content_type: "video_script", status: "nueva", created_at: "2026-06-17T11:04:00Z", idea: "«Compro en el mercado con 20€: lo que haría con eso»", why_interesting: "El reto del presupuesto limitado humaniza y enseña al mismo tiempo. Alta viralidad en TikTok y fácil de serializar." },

  // ── Ana — generación 1 ────────────────────────────────────────
  { id: "i-a1-1", profileId: "ana", generation_id: "gen-ana-1", platform: "instagram", content_type: "video_script", status: "guardada", created_at: "2026-06-16T09:00:00Z", idea: "«Por qué te duele la espalda cuando trabajas desde casa (y qué hacer hoy)»", why_interesting: "Problema universal post-pandemia con altísimo volumen de búsqueda. Tu enfoque basado en evidencia y siempre accionable es perfecto para este tema." },
  { id: "i-a1-2", profileId: "ana", generation_id: "gen-ana-1", platform: "tiktok", content_type: "video_script", status: "guardada", created_at: "2026-06-16T09:01:00Z", idea: "«El estiramiento que todo el mundo hace mal (y por qué no funciona)»", why_interesting: "TikTok adora el formato 'lo estás haciendo mal'. Tu credencial de fisio basada en evidencia da el hook y la autoridad." },
  { id: "i-a1-3", profileId: "ana", generation_id: "gen-ana-1", platform: "youtube", content_type: "video_script", status: "nueva", created_at: "2026-06-16T09:02:00Z", idea: "«Guía completa: volver a correr después de una lesión sin recaer»", why_interesting: "Contenido evergreen de alto valor para runners. Los vídeos largos informativos tienen excelente posicionamiento en YouTube." },
  { id: "i-a1-4", profileId: "ana", generation_id: "gen-ana-1", platform: "instagram", content_type: "carousel", status: "nueva", created_at: "2026-06-16T09:03:00Z", idea: "«3 mitos del dolor de cuello que tu fisio quiere que dejes de creer»", why_interesting: "El desmontaje de mitos con autoridad clínica genera saves y shares. Tu voz cálida y tu posicionamiento sin culpabilizar son el diferencial." },
  { id: "i-a1-5", profileId: "ana", generation_id: "gen-ana-1", platform: "tiktok", content_type: "video_script", status: "nueva", created_at: "2026-06-16T09:04:00Z", idea: "«Tendinitis del runner: cómo diferenciarla de la rotura (sin médico)»", why_interesting: "Miedo muy común en la comunidad runner. Tu capacidad de tranquilizar con evidencia es exactamente lo que buscan." },
];

// ── Biblioteca de contenidos ──────────────────────────────────
export const DEMO_LIBRARY: DemoLibraryItem[] = [
  // ── Carlos ────────────────────────────────────────────────────
  { id: "lib-c1", profileId: "carlos", title: "Análisis del ecosistema emprendedor español Q2 2026", tags: ["ecosistema", "startups", "análisis"], originalFileName: "ecosistema-q2-2026.md", originalExtension: "md", originalSize: 18400, sourceType: "manual_upload", status: "completed", markdownSize: 18400, createdAt: "2026-06-10T09:00:00Z", updatedAt: "2026-06-10T09:00:00Z" },
  { id: "lib-c2", profileId: "carlos", title: "Entrevista con Vicky Gama — Cracks EP.47 (transcripción)", tags: ["cracks", "entrevista", "fundraising"], originalFileName: "cracks-ep47-transcript.txt", originalExtension: "txt", originalSize: 24600, sourceType: "manual_upload", status: "completed", markdownSize: 22100, createdAt: "2026-06-05T14:00:00Z", updatedAt: "2026-06-05T14:00:00Z" },
  { id: "lib-c3", profileId: "carlos", title: "Newsletter #23: El mapa real del ecosistema", tags: ["newsletter", "ecosistema", "nacional"], originalFileName: "newsletter-23.md", originalExtension: "md", originalSize: 9800, sourceType: "manual_upload", status: "completed", markdownSize: 9800, createdAt: "2026-05-28T08:00:00Z", updatedAt: "2026-05-28T08:00:00Z" },
  { id: "lib-c4", profileId: "carlos", title: "Post viral de LinkedIn sobre pactos de socios (captura + análisis)", tags: ["linkedin", "viral", "referencia"], originalFileName: "post-pactos-referencia.png", originalExtension: "png", originalSize: 412000, sourceType: "manual_upload", status: "completed", markdownSize: 1240, createdAt: "2026-06-01T11:00:00Z", updatedAt: "2026-06-01T11:00:00Z" },
  { id: "lib-c5", profileId: "carlos", title: "Notas del evento UpAndalus 2026", tags: ["evento", "andalucía", "networking"], originalFileName: "upandalus-2026-notas.txt", originalExtension: "txt", originalSize: 7200, sourceType: "manual_upload", status: "completed", markdownSize: 6900, createdAt: "2026-05-15T20:00:00Z", updatedAt: "2026-05-15T20:00:00Z" },

  // ── Lucía ──────────────────────────────────────────────────────
  { id: "lib-l1", profileId: "lucia", title: "Modelo de pacto de socios comentado (anonimizado)", tags: ["pacto socios", "plantilla", "startup"], originalFileName: "pacto-socios-comentado.md", originalExtension: "md", originalSize: 31200, sourceType: "manual_upload", status: "completed", markdownSize: 31200, createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z" },
  { id: "lib-l2", profileId: "lucia", title: "Term sheet real de Serie A española (anonimizado)", tags: ["term sheet", "serie a", "fundraising"], originalFileName: "term-sheet-serie-a-anon.pdf", originalExtension: "pdf", originalSize: 189000, sourceType: "manual_upload", status: "completed", markdownSize: 14500, createdAt: "2026-05-20T09:00:00Z", updatedAt: "2026-05-20T09:00:00Z" },
  { id: "lib-l3", profileId: "lucia", title: "Newsletter #18: Errores legales que cuestan caro", tags: ["newsletter", "errores legales"], originalFileName: "newsletter-18-errores.md", originalExtension: "md", originalSize: 8400, sourceType: "manual_upload", status: "completed", markdownSize: 8400, createdAt: "2026-05-05T08:00:00Z", updatedAt: "2026-05-05T08:00:00Z" },
  { id: "lib-l4", profileId: "lucia", title: "Guión del carrusel sobre liquidation preference", tags: ["carrusel", "guión", "linkedin"], originalFileName: "guion-liq-pref.txt", originalExtension: "txt", originalSize: 3200, sourceType: "manual_upload", status: "completed", markdownSize: 3200, createdAt: "2026-06-12T16:00:00Z", updatedAt: "2026-06-12T16:00:00Z" },

  // ── Marc ───────────────────────────────────────────────────────
  { id: "lib-m1", profileId: "marc", title: "Recetario de temporada: productos de junio-julio", tags: ["temporada", "recetas", "junio"], originalFileName: "recetario-junio-julio.md", originalExtension: "md", originalSize: 14600, sourceType: "manual_upload", status: "completed", markdownSize: 14600, createdAt: "2026-06-02T10:00:00Z", updatedAt: "2026-06-02T10:00:00Z" },
  { id: "lib-m2", profileId: "marc", title: "Notas de servicio: técnicas clave del pase de hoy", tags: ["servicio", "cocina", "técnica"], originalFileName: "notas-servicio-jun22.txt", originalExtension: "txt", originalSize: 4800, sourceType: "manual_upload", status: "completed", markdownSize: 4500, createdAt: "2026-06-22T23:00:00Z", updatedAt: "2026-06-22T23:00:00Z" },
  { id: "lib-m3", profileId: "marc", title: "Guión del Reel viral de tortilla (referencia)", tags: ["guión", "reel", "referencia", "viral"], originalFileName: "guion-reel-tortilla-ref.md", originalExtension: "md", originalSize: 2100, sourceType: "google_drive", status: "synced", markdownSize: 2100, createdAt: "2026-05-30T14:00:00Z", updatedAt: "2026-06-10T14:00:00Z" },
  { id: "lib-m4", profileId: "marc", title: "Análisis de 10 cuentas de gastronomía en TikTok e Instagram", tags: ["análisis", "competencia", "tiktok", "instagram"], originalFileName: "analisis-cuentas-gastro.md", originalExtension: "md", originalSize: 11200, sourceType: "manual_upload", status: "completed", markdownSize: 11200, createdAt: "2026-05-18T11:00:00Z", updatedAt: "2026-05-18T11:00:00Z" },

  // ── Ana ────────────────────────────────────────────────────────
  { id: "lib-a1", profileId: "ana", title: "Revisión sistemática: ejercicio vs. reposo en lumbalgia (2025)", tags: ["evidencia", "lumbalgia", "ejercicio", "revisión"], originalFileName: "revision-lumbalgia-2025.md", originalExtension: "md", originalSize: 22400, sourceType: "manual_upload", status: "completed", markdownSize: 22400, createdAt: "2026-06-01T09:00:00Z", updatedAt: "2026-06-01T09:00:00Z" },
  { id: "lib-a2", profileId: "ana", title: "Casos de consulta anonimizados — runners (Q2 2026)", tags: ["casos", "runners", "consulta"], originalFileName: "casos-runners-q2-2026.txt", originalExtension: "txt", originalSize: 9600, sourceType: "manual_upload", status: "completed", markdownSize: 9100, createdAt: "2026-06-15T10:00:00Z", updatedAt: "2026-06-15T10:00:00Z" },
  { id: "lib-a3", profileId: "ana", title: "Guiones de los 5 Reels más guardados", tags: ["guiones", "reels", "instagram"], originalFileName: "guiones-reels-top5.md", originalExtension: "md", originalSize: 7800, sourceType: "google_drive", status: "synced", markdownSize: 7800, createdAt: "2026-05-20T12:00:00Z", updatedAt: "2026-06-18T12:00:00Z" },
  { id: "lib-a4", profileId: "ana", title: "Newsletter #12: Mitos que retrasan tu recuperación", tags: ["newsletter", "mitos", "recuperación"], originalFileName: "newsletter-12-mitos.md", originalExtension: "md", originalSize: 8900, sourceType: "manual_upload", status: "completed", markdownSize: 8900, createdAt: "2026-05-10T08:00:00Z", updatedAt: "2026-05-10T08:00:00Z" },
];

// ── Entradas de calendario ────────────────────────────────────
// Semana actual (lunes 22 junio) y la siguiente (29 junio).
export const DEMO_CALENDAR: DemoCalendarEntry[] = [
  // ── Carlos — semana 22 jun ────────────────────────────────────
  { id: "cal-c1", profileId: "carlos", platform: "linkedin", idea: "Carrusel: «5 cláusulas del pacto de socios que rompen equipos»", why_now: "Señal de la semana: cierre de startup por conflicto entre socios. Alcance máximo en carrusel.", suggested_slot: "martes 8:00", week_of: "2026-06-22", status: "nueva", based_on: { hook: "He visto romperse más equipos por el pacto de socios que por falta de mercado." }, content_type: "carousel", content_category: "educational", expires_at: "2026-06-29T00:00:00Z" },
  { id: "cal-c2", profileId: "carlos", platform: "substack", idea: "Newsletter: el mapa real del ecosistema fuera de Madrid-Barcelona", why_now: "Tu wedge de cobertura nacional + notas de apoyo en Substack toda la semana.", suggested_slot: "jueves 7:30", week_of: "2026-06-22", status: "liked", based_on: { hook: "El ecosistema no termina en la M-30." }, content_type: "post_text", content_category: "informative", expires_at: "2026-07-02T00:00:00Z" },
  { id: "cal-c3", profileId: "carlos", platform: "youtube", idea: "Entrevista a fundador que levantó sin VC — long-form + 3 shorts", why_now: "Estrategia híbrida YouTube Shorts/long-form. Alcance frío + autoridad.", suggested_slot: "sábado 11:00", week_of: "2026-06-22", status: "nueva", based_on: { hook: "Levantó 1,2M sin hablar con un solo VC." }, content_type: "video_script", content_category: "informative", expires_at: "2026-07-05T00:00:00Z" },
  // ── Carlos — semana 29 jun ────────────────────────────────────
  { id: "cal-c4", profileId: "carlos", platform: "linkedin", idea: "Post: «Bootstrappers vs VC-backed — lo que los números no te dicen»", why_now: "El debate está activo. Tu perspectiva de alguien que ha vivido ambos lados.", suggested_slot: "martes 8:00", week_of: "2026-06-29", status: "nueva", based_on: { hook: "He estado en los dos lados. Aquí lo que no te cuentan los datos." }, content_type: "post_text", content_category: "educational", expires_at: "2026-07-06T00:00:00Z" },

  // ── Lucía — semana 22 jun ─────────────────────────────────────
  { id: "cal-l1", profileId: "lucia", platform: "linkedin", idea: "Carrusel: «Term sheet en cristiano — las 6 líneas que cambian tu vida»", why_now: "Temporada de cierres antes de verano. Máximo alcance educativo en LinkedIn.", suggested_slot: "miércoles 8:30", week_of: "2026-06-22", status: "nueva", based_on: { hook: "Firmé mi primer term sheet sin entender la mitad." }, content_type: "carousel", content_category: "educational", expires_at: "2026-07-01T00:00:00Z" },
  { id: "cal-l2", profileId: "lucia", platform: "substack", idea: "Newsletter: «El cofundador que se fue con el 30%»", why_now: "Storytelling de caso real, máximo share rate en Substack.", suggested_slot: "lunes 7:00", week_of: "2026-06-22", status: "liked", based_on: { hook: "Se fue a los 8 meses. Con el 30%." }, content_type: "post_text", content_category: "educational", expires_at: "2026-06-30T00:00:00Z" },
  { id: "cal-l3", profileId: "lucia", platform: "instagram", idea: "Carrusel: «3 errores que vi esta semana en pactos de socios»", why_now: "Audiencia joven en Instagram. Formato rápido y accionable.", suggested_slot: "viernes 12:00", week_of: "2026-06-22", status: "nueva", based_on: { hook: "Esta semana vi 3 errores que van a costar muy caro." }, content_type: "carousel", content_category: "educational", expires_at: "2026-07-03T00:00:00Z" },

  // ── Marc — semana 22 jun ───────────────────────────────────────
  { id: "cal-m1", profileId: "marc", platform: "instagram", idea: "Reel: «Por qué tu tortilla queda seca» — el punto exacto del cuajado", why_now: "Debate eterno, alto engagement. Watch time + DMs.", suggested_slot: "jueves 14:00", week_of: "2026-06-22", status: "liked", based_on: { hook: "Llevas toda la vida haciéndola mal." }, content_type: "video_script", content_category: "educational", expires_at: "2026-07-03T00:00:00Z" },
  { id: "cal-m2", profileId: "marc", platform: "tiktok", idea: "Serie inicio: «Un producto, 3 platos» — alcachofas de temporada", why_now: "TikTok premia series con fidelización. Temporada perfecta.", suggested_slot: "domingo 13:00", week_of: "2026-06-22", status: "nueva", based_on: { hook: "3 platos, 1 producto, 0 desperdicio." }, content_type: "video_script", content_category: "educational", expires_at: "2026-06-29T00:00:00Z" },
  { id: "cal-m3", profileId: "marc", platform: "youtube", idea: "«Un día en el mercado de La Boqueria — así compro yo»", why_now: "YouTube long-form + formato 'día conmigo'. Alta retención.", suggested_slot: "sábado 10:00", week_of: "2026-06-22", status: "nueva", based_on: { hook: "Aquí cómo compro yo cuando nadie me graba." }, content_type: "video_script", content_category: "informative", expires_at: "2026-07-05T00:00:00Z" },

  // ── Ana — semana 22 jun ────────────────────────────────────────
  { id: "cal-a1", profileId: "ana", platform: "instagram", idea: "Reel: «El reposo no te va a curar la espalda» — 3 movimientos para hoy", why_now: "Mito del reposo. Alto save rate en Reels.", suggested_slot: "martes 18:00", week_of: "2026-06-22", status: "nueva", based_on: { hook: "Si te han dicho que descanses, sigue leyendo." }, content_type: "video_script", content_category: "educational", expires_at: "2026-06-30T00:00:00Z" },
  { id: "cal-a2", profileId: "ana", platform: "tiktok", idea: "Serie mitos: «Tu abuela te miente» — Episodio 1: frío y calor", why_now: "TikTok adora el desmontaje de mitos. Formato de serie para fidelización.", suggested_slot: "jueves 18:30", week_of: "2026-06-22", status: "liked", based_on: { hook: "Tu abuela te miente. Con buena intención, pero te miente." }, content_type: "video_script", content_category: "educational", expires_at: "2026-07-03T00:00:00Z" },
  { id: "cal-a3", profileId: "ana", platform: "youtube", idea: "Short: «¿Crujen tus rodillas? Lo que de verdad significa»", why_now: "Alta búsqueda, alto miedo. Tranquiliza con evidencia.", suggested_slot: "viernes 19:00", week_of: "2026-06-22", status: "nueva", based_on: { hook: "Que crujan no significa que se rompan." }, content_type: "video_script", content_category: "educational", expires_at: "2026-07-04T00:00:00Z" },
];

export function ideasFor(profileId: string): DemoIdea[] {
  return DEMO_IDEAS.filter((i) => i.profileId === profileId);
}
export function libraryFor(profileId: string): DemoLibraryItem[] {
  return DEMO_LIBRARY.filter((i) => i.profileId === profileId);
}
export function fullProposalsFor(profileId: string): DemoFullProposal[] {
  return DEMO_FULL_PROPOSALS.filter((p) => p.profileId === profileId);
}
export function calendarFor(profileId: string): DemoCalendarEntry[] {
  return DEMO_CALENDAR.filter((e) => e.profileId === profileId);
}
