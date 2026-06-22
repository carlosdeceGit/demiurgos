import type { DemoProfile } from "./types";

// 4 perfiles de sectores distintos. Demuestran que el motor es genérico:
// el mismo sistema sirve para un emprendedor, una abogada, un chef o una fisio.
export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: "carlos",
    displayName: "Carlos Delgado",
    sector: "Emprendimiento",
    positioning:
      "La referencia del ecosistema emprendedor español. Voz con criterio, no cuenta de noticias sin alma. Cobertura nacional real, no solo Madrid-Barcelona.",
    audience:
      "Founders en fase inicial y de crecimiento (startups por debajo de ~10M€), sobre todo recién llegados al ecosistema.",
    voice: [
      "Cercano, analítico, anti-humo",
      "Nada de raya larga ni jerga de IA",
      "Si algo es flojo, se dice",
    ],
    pillars: [
      {
        title: "Criterio del ecosistema",
        why: "Tengo el acceso (UpAndalus, Cracks) y el criterio para opinar, no solo listar.",
      },
      {
        title: "Lecciones de fundador",
        why: "He construido de verdad, con éxitos y cicatrices.",
      },
      {
        title: "IA aplicada al negocio real",
        why: "Estoy en la frontera aplicándola a proyectos reales, incluido este.",
      },
    ],
    activePlatforms: ["linkedin", "youtube", "substack"],
    onboardingCompleted: true,
    completeness: 82,
    createdAt: "2026-06-21T17:13:00.000Z",
  },
  {
    id: "lucia",
    displayName: "Lucía Romero",
    sector: "Abogada de startups",
    positioning:
      "La abogada que los founders entienden. Traduce el papeleo legal a decisiones de negocio, sin sustos ni letra pequeña.",
    audience:
      "Founders y operadores de startups que firman pactos de socios, rondas y contratos sin tener un abogado de cabecera.",
    voice: [
      "Clara, didáctica, tranquilizadora",
      "Cero jerga jurídica innecesaria",
      "Siempre con un ejemplo concreto",
    ],
    pillars: [
      {
        title: "Pactos de socios sin dramas",
        why: "He visto romperse equipos por cláusulas que nadie leyó a tiempo.",
      },
      {
        title: "Rondas y term sheets",
        why: "Acompaño la negociación desde dentro, no desde el despacho.",
      },
      {
        title: "Errores legales que cuestan caro",
        why: "Casos reales (anonimizados) que enseñan más que cualquier manual.",
      },
    ],
    activePlatforms: ["linkedin", "substack", "instagram"],
    onboardingCompleted: true,
    completeness: 74,
    createdAt: "2026-05-30T09:00:00.000Z",
  },
  {
    id: "marc",
    displayName: "Marc Vidal",
    sector: "Chef / Gastronomía",
    positioning:
      "Cocina de producto sin postureo. Del mercado a la mesa, enseñando el porqué de cada técnica, no solo el resultado bonito.",
    audience:
      "Aficionados a la cocina que quieren cocinar mejor en casa y foodies que valoran el producto de temporada.",
    voice: [
      "Apasionado, directo, con humor",
      "Nada de tecnicismos de escuela",
      "El producto manda, no el emplatado",
    ],
    pillars: [
      {
        title: "Producto de temporada",
        why: "Cocino lo que hay ahora en el mercado, y explico por qué.",
      },
      {
        title: "Técnica explicada",
        why: "Enseño el porqué, para que se replique sin receta.",
      },
      {
        title: "Detrás del servicio",
        why: "El día a día real de una cocina, sin filtros de TV.",
      },
    ],
    activePlatforms: ["instagram", "tiktok", "youtube"],
    onboardingCompleted: true,
    completeness: 68,
    createdAt: "2026-06-05T12:30:00.000Z",
  },
  {
    id: "ana",
    displayName: "Ana Torres",
    sector: "Fisioterapia / Salud",
    positioning:
      "Fisioterapia basada en evidencia, contada para que cualquiera la entienda. Menos miedo, más movimiento.",
    audience:
      "Personas con dolores recurrentes (espalda, cuello, runners) cansadas de consejos contradictorios de internet.",
    voice: [
      "Rigurosa pero cálida",
      "Desmonta mitos sin culpabilizar",
      "Siempre accionable: qué hacer hoy",
    ],
    pillars: [
      {
        title: "Mitos que retrasan tu recuperación",
        why: "Veo cada día el daño que hace la desinformación.",
      },
      {
        title: "Ejercicio como medicina",
        why: "El movimiento bien pautado resuelve más que el reposo.",
      },
      {
        title: "Casos de consulta (anonimizados)",
        why: "Lo real engancha y educa mejor que la teoría.",
      },
    ],
    activePlatforms: ["instagram", "tiktok", "youtube"],
    onboardingCompleted: false,
    completeness: 56,
    createdAt: "2026-06-12T08:15:00.000Z",
  },
];

export function getDemoProfile(id: string): DemoProfile | undefined {
  return DEMO_PROFILES.find((p) => p.id === id);
}

export const DEFAULT_DEMO_PROFILE_ID = "carlos";
