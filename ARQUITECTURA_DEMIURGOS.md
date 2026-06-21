# Demiurgos — Arquitectura del Sistema

> Versión 2.0 · Junio 2026
> Estado: rediseño tras decisiones de onboarding y producto
> Sustituye a la visión monolítica del BLUEPRINT. El README sigue siendo la visión comercial; este documento es la arquitectura técnica y conceptual.

---

## 0. Por qué este rediseño

El BLUEPRINT original mezclaba en un mismo plano cosas que tienen que vivir separadas. Si el comportamiento del sistema y los datos de un usuario están pegados, pasan dos cosas malas:

1. **No escala a otros profesionales.** Si el motor "sabe quién es Carlos", cualquier otro usuario recibe propuestas contaminadas por el perfil de Carlos.
2. **No se mantiene.** El conocimiento de cómo funciona cada red cambia cada semana. Si está cosido dentro del prompt del usuario, hay que reescribir el sistema entero cada vez que TikTok cambia el algoritmo.

La solución es una arquitectura de capas con una regla estricta: **cada capa no sabe nada de las que tiene encima.** El motor no sabe quién eres. El esquema no sabe qué red usas. El conocimiento del ecosistema no sabe nada de ningún usuario concreto.

---

## 1. Las seis capas

```
┌──────────────────────────────────────────────────────────────────────┐
│  CAPA 6 — PRODUCTO / DATOS (multi-tenant)                             │
│  Auth, base de datos, una fila de perfil por usuario, aislamiento.    │
└──────────────────────────────────────────────────────────────────────┘
        ▲ inyecta en runtime
┌──────────────────────────────────────────────────────────────────────┐
│  CAPA 5 — ACTUALIZACIÓN VIVA                                          │
│  Refresca el conocimiento del ecosistema (global) y los perfiles      │
│  (por usuario) cada semana. El proyecto está vivo, no congelado.      │
└──────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│  CAPA 4 — CONOCIMIENTO DEL ECOSISTEMA (compartido, NEUTRAL)           │
│  Cómo funciona cada red: algoritmo, formatos, hooks, frecuencia.      │
│  Idéntico para todos los usuarios. Cero datos personales.             │
│  → CONOCIMIENTO_REDES.md                                              │
└──────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│  CAPA 3 — INSTANCIA DE PERFIL (un usuario)                           │
│  Los valores concretos de UNA persona. Una fila. Aislada.            │
│  → PERFIL_CARLOS.md (instancia 0, dogfooding)                        │
└──────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│  CAPA 2 — ESQUEMA DE PERFIL GENÉRICO (la plantilla)                  │
│  La estructura universal de un perfil. Campos, sin valores.          │
│  Sirve para cualquier profesional, de cualquier sector.              │
│  → PERFIL_PLANTILLA.md                                                │
└──────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│  CAPA 1 — MOTOR (el cerebro, genérico)                               │
│  La lógica de Demiurgos: cómo entrevista, cómo razona el "por qué",   │
│  cómo genera el paquete creativo. Parametrizado con {{slots}}.        │
│  Cero referencias a ningún usuario. Idéntico para todos.             │
│  → INSTRUCCIONES.md                                                   │
└──────────────────────────────────────────────────────────────────────┘
```

### Regla de oro de la separación

> El motor (capa 1) se escribe una vez y vale para todos.
> El esquema (capa 2) se diseña una vez y vale para todos.
> El conocimiento del ecosistema (capa 4) se mantiene en un solo sitio y vale para todos.
> Lo único que cambia de un usuario a otro es la instancia de perfil (capa 3).

Si algún día quieres comprobar que no hay contaminación entre usuarios, abre el motor y busca la palabra "Carlos". No debe aparecer ni una vez. Si aparece, es un bug de arquitectura.

---

## 2. Capa 1 — El Motor

**Qué es:** el system prompt maestro de Demiurgos. La lógica de comportamiento, no los datos.

**Qué contiene:**

- Los modos de trabajo (onboarding, propuestas semanales, inyección de contexto, refinar pieza).
- Cómo conduce la entrevista de perfilado.
- Cómo construye el "por qué ahora" de cada propuesta.
- El formato exacto de salida de cada paquete creativo.
- Las reglas duras de calidad: no inventar datos, ser crítico y no peloteador, anclar siempre al perfil, no prometer métricas.

**Qué NO contiene:** ningún nombre de usuario, ninguna voz concreta, ningún pilar temático, ningún dato de ninguna persona. Todo eso son slots:

```
Eres el director creativo de {{usuario.nombre}}.
Tu fuente de verdad es {{perfil}} (la instancia de este usuario).
Aplicas el conocimiento de {{conocimiento_ecosistema}} para decidir formato y timing.
Las reglas de voz que respetas son {{perfil.voz}}, nunca unas por defecto.
```

**Dónde vive:** `v1-proyecto-claude/INSTRUCCIONES.md`. En el Proyecto de Claude actual, es el texto que va en Ajustes del proyecto. En la app futura, es el system prompt que se compone en cada llamada.

---

## 3. Capa 2 — El Esquema de Perfil Genérico

**Qué es:** la plantilla vacía de un perfil. La lista de campos que cualquier profesional rellena, sea emprendedor, médico, abogado o cocinero.

**Por qué importa:** es el contrato entre el onboarding y el motor. Define qué información necesita el sistema para generar propuestas no genéricas. Cuando productices, este esquema es literalmente la definición de la tabla `profiles` en la base de datos.

**Campos del esquema (resumen, detalle en PERFIL_PLANTILLA.md):**

- Identidad y posicionamiento: en qué quiere ser referencia, frase objetivo.
- Pilares temáticos: 3 a 5, cada uno con su "por qué tú".
- Audiencia: a quién le habla, qué dolor real le resuelve, qué quiere que haga.
- Voz y tono: reglas duras, ejemplos que ama, ejemplos que odia.
- Datos tácitos: línea roja, opinión impopular, qué le da pereza, su wedge.
- Objetivos y métrica de éxito.
- Plataformas activas y rol de cada una.
- Patrones de rendimiento (se llena con el uso).
- Referentes validados.

**Clave de la generalización:** los campos son universales, los valores son personales. "Reglas de voz" es un campo que existe para todos. Que un usuario odie la raya larga y otro la adore es valor de instancia, no del esquema.

---

## 4. Capa 3 — La Instancia de Perfil

**Qué es:** el esquema relleno para una persona concreta. Una fila de datos. Un JSON.

**Instancia 0:** Carlos, en `v1-proyecto-claude/PERFIL_CARLOS.md`. Es el primer usuario y el caso de dogfooding. Sirve para validar que el esquema captura lo que hace falta y que el motor produce algo bueno con él.

**Aislamiento:** la instancia de un usuario solo se inyecta en su propia sesión. El usuario B nunca ve ni una palabra del perfil del usuario A. En la app, esto es seguridad multi-tenant estándar (row level security en Supabase).

---

## 5. Capa 4 — El Conocimiento del Ecosistema (neutral y compartido)

**Qué es:** la base de conocimiento de cómo funciona cada red social en este momento. Algoritmo, formatos que rinden, anatomía de los hooks, frecuencia óptima, señales que premia cada plataforma, errores que penalizan.

**Regla crítica:** es **neutral**. No está escrito para Carlos ni para ningún sector. Describe el comportamiento de las plataformas, que es el mismo para un emprendedor que para un dentista. La personalización ocurre cuando el motor cruza este conocimiento neutral con la instancia de perfil.

**Redes cubiertas:** LinkedIn, YouTube, TikTok, Instagram, X, Substack.

**Dónde vive:** `v1-proyecto-claude/CONOCIMIENTO_REDES.md`. Es un knowledge file compartido. En la app, es una tabla o un conjunto de documentos que el motor recupera según las plataformas activas del usuario.

**Cómo se usa en una propuesta:** el motor no dice "publica un carrusel porque sí". Cruza tres fuentes:

```
INSTANCIA (capa 3)        →  quién eres, tu voz, tu pilar
CONOCIMIENTO (capa 4)     →  en LinkedIn los documentos rinden 6,6% de engagement
SEÑALES FRESCAS (capa 5)  →  esta semana tu nicho habla de X
                                    ↓
PROPUESTA: carrusel en LinkedIn sobre tu pilar 2, con este hook, el martes.
```

---

## 6. Capa 5 — Actualización Viva

El proyecto está vivo. Dos relojes distintos.

### Reloj global: el conocimiento del ecosistema

Las redes cambian el algoritmo cada pocas semanas. El conocimiento de la capa 4 caduca. Necesita un protocolo de refresco:

- **Cadencia:** revisión semanal ligera, revisión profunda mensual.
- **Disparador:** cambios anunciados de algoritmo, caídas de alcance reportadas, formatos nuevos.
- **Quién:** en v1, semiautomático. Demiurgos hace el deep research y propone el diff a CONOCIMIENTO_REDES.md. En la app, una tarea programada que regenera la base de conocimiento y la versiona.
- **Versionado:** cada ficha de red lleva fecha de última actualización. Nunca se borra lo viejo sin fechar lo nuevo.

### Reloj individual: el perfil del usuario

El perfil de cada usuario también está vivo, pero por otro motivo: aprende del uso.

- Cada vez que el usuario acepta o rechaza una propuesta, eso es señal.
- Cada pieza que rinde bien o mal entra en "patrones de rendimiento".
- Cada inyección de contexto (un artículo, una idea, un rechazo) refina la voz o los pilares.
- Demiurgos no edita el perfil solo. Propone el diff y el usuario lo aplica.

Este doble reloj es el moat: el conocimiento del ecosistema te mantiene al día con las plataformas, y el perfil acumulado te hace insustituible para ese usuario.

---

## 7. Capa 6 — Producto y Datos

Cómo se materializa todo esto cuando deja de ser un Proyecto de Claude y pasa a ser app.

**Mapa capa → tabla:**

| Capa | Artefacto en v1 | En la app (Supabase) |
|---|---|---|
| Motor | `INSTRUCCIONES.md` | system prompt compuesto en runtime |
| Esquema | `PERFIL_PLANTILLA.md` | definición de la tabla `profiles` |
| Instancia | `PERFIL_CARLOS.md` | una fila en `profiles` por usuario |
| Conocimiento | `CONOCIMIENTO_REDES.md` | tabla `ecosystem_knowledge` versionada |
| Actualización | deep research manual | tareas programadas + aprendizaje del perfil |
| Producto | el Proyecto de Claude | Next.js + Supabase + Claude API |

El esquema de base de datos del BLUEPRINT (tablas `profiles`, `memories`, `proposals`, etc.) sigue siendo válido. Este rediseño añade una tabla que faltaba: `ecosystem_knowledge`, la materialización de la capa 4, compartida y versionada, desacoplada de cualquier usuario.

---

## 8. Cómo encaja con el camino de construcción

Nada de lo anterior cambia el plan por fases del README. Lo afina:

- **Fase 1 (MVP personal):** las cuatro primeras capas existen como archivos Markdown en el Proyecto de Claude. El motor entrevista, el esquema se rellena con Carlos, el conocimiento del ecosistema ya está investigado. La actualización es manual.
- **Fase 2 (conexión e inteligencia):** la capa 5 se semiautomatiza, el conocimiento se versiona, los perfiles se enriquecen con datos reales de redes.
- **Fase 5 (productización):** la capa 6 se vuelve multi-tenant de verdad. Aquí es donde la separación motor/instancia paga: dar de alta a un usuario nuevo es crear una fila, no reescribir el sistema.

---

## 9. Lo que resuelve este rediseño, en una frase

El miedo legítimo era: "si construyo esto centrado en mí, otro profesional recibirá recomendaciones basadas en mí". La arquitectura de capas lo resuelve por diseño: lo que es de Carlos vive solo en una fila aislada (capa 3), y todo lo demás (motor, esquema, conocimiento del ecosistema) es neutral y compartido. Otro usuario trae su propia fila y el sistema funciona igual de bien, sin una sola traza de Carlos.

---

*Demiurgos. Del griego: el artesano que da forma al mundo a partir del caos.*
