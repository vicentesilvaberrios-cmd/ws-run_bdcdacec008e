# UX Guidelines — estándar de experiencia de la fábrica

Estas reglas son **obligatorias** para todo el frontend. El objetivo: experiencias
consistentes, intuitivas, responsive y accesibles, escritas para usuarios finales
(no para desarrolladores).

## 1. Lenguaje de cara al usuario (lo más importante)
- **Todo el texto visible va en español, orientado al usuario final.**
- **PROHIBIDO mostrar jerga técnica en la UI.** Nunca uses términos como:
  `CRUD`, `endpoint`, `payload`, `request`, `API`, `backend`, `query`, `schema`,
  `string`, `boolean`, `null`, `id` (como etiqueta visible), `submit`.
- Usa verbos y sustantivos del dominio:
  - en vez de "CRUD de productos" → "Gestionar productos"
  - en vez de "Crear/Editar/Eliminar registro" → "Crear", "Editar", "Eliminar" (el sustantivo del dominio)
  - en vez de "Submit" → "Guardar", "Confirmar", "Enviar"
  - en vez de "Listado" técnico → títulos claros ("Productos", "Reservas de hoy")
- Mensajes de error en lenguaje humano y accionable ("No pudimos guardar el producto. Revisa el precio."), nunca el error crudo del sistema.
- **Tono consistente: TUTEO en toda la app** ("Elige", "Guarda", "Comparte tu link"). PROHIBIDO el
  voseo ("Elegí", "Guardá", "Compartí", "atendés", "ofrecés") y mezclar tratamientos entre
  pantallas. El público es Chile: español neutro de tuteo, sin regionalismos rioplatenses.

## 2. Consistencia (usar el design system)
- Reutiliza SIEMPRE las clases de `app/globals.css`: `.btn`/`.btn-primary`/`.btn-danger`,
  `.card`, `.panel`, `.field`/`.input`, `.table`/`.table-wrap`, `.badge`, `.alert`,
  `.navbar`, `.kpi`, `.empty-state`, utilidades de layout (`.container`, `.grid`, `.cluster`, `.stack`).
- No inventes estilos ad-hoc ni colores hardcodeados: usa los tokens (`var(--brand)`, `var(--sp-4)`, etc.).
- Mismos patrones para acciones equivalentes en todas las pantallas (un solo estilo de botón primario, un solo patrón de formulario, un solo patrón de tabla).
- Marca/acentos: si el proyecto tiene color de marca, ajústalo SOLO vía `--brand` en `:root`; no rieguen colores sueltos.

## 3. Responsive (mobile-first)
- Diseña primero para móvil; mejora en pantallas grandes con los breakpoints del design system (640px, 960px).
- Tablas anchas SIEMPRE dentro de `.table-wrap` (scroll horizontal en móvil).
- Grids con `.grid` + `.grid-sm-2`/`.grid-md-3`/`.grid-md-4` en vez de anchos fijos.
- Objetivos táctiles ≥ 40px (los `.btn`/`.input` ya lo cumplen).

## 4. Accesibilidad
- Todo input tiene `<label>` asociado (`htmlFor`/`id`).
- Botones e íconos con texto o `aria-label`. Imágenes con `alt`.
- Errores de campo con `aria-invalid` y texto `.error-text` asociado por `aria-describedby`.
- No comunicar estados solo por color: acompaña con texto/ícono (usa `.badge-ok/-warn/-danger`).
- Contraste suficiente (los tokens ya están calibrados).

## 5. Estados de cada pantalla (no olvidar)
Toda vista que carga datos debe contemplar y mostrar:
- **Cargando** (skeleton o texto "Cargando…").
- **Vacío** con `.empty-state` y mensaje útil ("Aún no hay reservas. Crea la primera.").
- **Error** con `.alert-error` y opción de reintentar.
- **Éxito** con feedback claro tras una acción (confirmación breve).

## 6. Flujos
- Acciones destructivas (eliminar) piden confirmación explícita.
- Formularios validan en cliente y muestran errores junto al campo.
- Navegación clara y consistente vía `.navbar`; el usuario siempre sabe dónde está y cómo volver.
- Jerarquía visual: un `h1` por pantalla con título claro del dominio.

## 7. Mínimo esfuerzo (menos clics) — OBLIGATORIO
El objetivo es que CUALQUIER usuario (incluso con poca práctica o educación) complete su tarea
con la menor cantidad de clics y decisiones posible.
- **Defaults inteligentes**: precarga los formularios con el valor más probable, de modo que el
  usuario pueda **Guardar sin cambiar nada** en el caso típico (ej. horario Lun–Vie 09:00–18:00 ya marcado).
- **Una sola acción principal por pantalla**: un único botón primario evidente (`.btn-primary`);
  todo lo demás es secundario (`.btn-ghost`). No compitas dos acciones primarias.
- **Un solo guardar**: si el usuario arma varios datos relacionados (varias filas/días), ofrécele
  **un botón Guardar al final**, no "guardar" por cada fila. Nada se persiste hasta ese botón.
- **Pickers acotados > texto libre**: usa `<select>`/opciones limitadas al rango válido (ej. horas
  07:00–20:00 en pasos de 30 min) en vez de inputs libres; así se elige rápido y no hay errores.
- **Opciones dependientes**: cuando una elección restringe a otra, ofrece SOLO lo válido (ej. el
  descanso solo muestra horas dentro del horario ya elegido). Previene errores antes de que ocurran.
- **Progressive disclosure**: muestra lo simple por defecto y esconde lo avanzado/poco frecuente
  tras un toggle "Modo avanzado" o un "Mostrar más". El camino por defecto debe ser el de 0–2 clics.
- **Presets / acciones masivas**: ofrece atajos ("Lun a Vie", "Copiar a todos los días") para no
  repetir la misma configuración muchas veces.
- **No pidas lo que puedes inferir**: evita pasos, campos y confirmaciones innecesarias.

## 8. Guía incorporada (explicaciones para el usuario) — OBLIGATORIO
Toda app debe enseñarse sola; no asumas que el usuario sabe qué hacer.
- **Subtítulo de propósito**: bajo el `h1` de cada pantalla, una línea breve que explique para qué
  sirve y qué puede hacer el usuario aquí (lenguaje simple, sin jerga).
- **Tooltips de ayuda**: en cualquier control no obvio, agrega una burbuja de ayuda con la clase
  `.help-tip` (`<span class="help-tip" data-tip="explicación clara" tabindex="0" role="note" aria-label="explicación clara">?</span>`). Explica el concepto en una frase, con un ejemplo si ayuda.
- **Empty states que enseñan**: el `.empty-state` no solo dice "no hay datos"; indica el **primer
  paso** y enlaza a la acción ("Aún no tienes servicios. Crea el primero para empezar a recibir reservas.").
- **Instructivo para flujos complejos**: si una pantalla tiene una configuración con varios pasos,
  incluye una guía corta numerada con la clase `.steps` (`<ol class="steps"><li>…</li></ol>`),
  con un ejemplo concreto. Mantenla breve (3–6 pasos).
- **Lenguaje para cualquier nivel**: frases cortas, palabras comunes, en segunda persona ("Elige
  los días en que atiendes"). Evita tecnicismos y ambigüedad.
- **Confirma con resumen legible**: tras configurar algo, muestra un resumen en texto claro
  ("Atiendes de Lunes a Viernes, de 09:00 a 18:00, con descanso de 13:00 a 14:00.").

> Las clases `.help-tip` y `.steps` ya están en `app/globals.css` (design system base): úsalas, no las reinventes.

## 9. Paneles internos / back-office (dashboards de equipo) — OBLIGATORIO
Un panel de administración es UI de cara al usuario igual que cualquier otra: el staff no conoce
la jerga interna del proyecto (nombres de experimentos, códigos de estado, IDs). Reglas:
- **PROHIBIDO exponer jerga de experimentación/testing** (`variante`, `A/B`, `test group`, `cohort`,
  `flag`, nombres de columnas de base de datos). Traduce SIEMPRE al valor de negocio que representa
  y que el staff reconoce sin contexto técnico: en vez de "Variante A" / "Variante B" muestra el
  dato real que distingue a cada grupo (ej. el precio cotizado: "$12.000/h" vs "$13.500/h").
- **Máximo ~7 columnas visibles por tabla.** Si hay más datos, prioriza los de negocio (nombre,
  fecha, contacto, estado) y mueve lo secundario a un detalle expandible o quítalo de la vista
  por defecto. Cuenta las columnas antes de dar por buena una tabla.
- **Una sola columna "Acciones"** con los botones de esa fila (confirmar, descartar, etc.). PROHIBIDO
  duplicar filas en una lista aparte solo para mostrar un botón de acción — es doble scroll y doble
  fuente de verdad para la misma información.
- **Buscador** cuando la tabla puede superar ~10 filas (por nombre/teléfono/identificador visible).
  Agrupa el buscador y los filtros en un solo bloque visual con la clase `.toolbar` (ya en
  `app/globals.css`), no los dejes sueltos en la pantalla.
- **Controles editables en tabla mantienen el mismo alto táctil que el resto del sistema** (≥40px,
  igual que `.input`/`.btn`). Nunca los encojas para "que quepan" — eso rompe la accesibilidad y la
  consistencia del design system.
- **Color de estado consistente en toda la app**: éxito/activo/confirmado = `.badge-ok`; en curso/
  pendiente = `.badge-warn`; fallido/descartado = `.badge-danger`; informativo/neutro = `.badge-info`
  o `.badge`. El mismo estado usa el mismo color en cualquier pantalla donde aparezca.
- **KPIs: máximo ~4 tarjetas destacadas a la vez.** Si hay un desglose con más categorías (ej. por
  canal, por región), agrúpalo en un panel/lista secundaria compacta, no una tarjeta `.kpi` por cada
  valor — más de 4 tarjetas del mismo tamaño no comunica jerarquía y el ojo no sabe qué mirar primero.
- **Etapas/estados numerados llevan su nombre visible** (ej. "Etapa 3 · Credenciales", no solo "Etapa 3"):
  el staff no debe memorizar qué significa cada número.
