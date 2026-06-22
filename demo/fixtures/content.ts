import type {
  DemoConversation,
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
