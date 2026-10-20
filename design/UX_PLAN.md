# Plan de UX — Que Dice Mi Mascota

> Aplicación de juego: subir video de mascota → "traducción" inventada con subtítulos.  
> Estándar visual: tokens y clases de `app/globals.css`. Tono: **tuteo en español**, sin jerga.  
> Ruta principal del usuario (camino feliz, ≤ 2 clics por etapa): `/` → `/analizando` → `/resultado` → `/historial`.

---

## 0. Sistema global (chrome compartido)

### `app/layout.tsx` — Layout raíz
- **Objetivo**: envolver toda la app con nav, nota de honestidad y pie; garantizar un solo `h1` por vista (no se pinta aquí).
- **Estructura**: `.container` con `<Nav />` arriba, `<main>` en el centro y `<footer>` con enlace a `/matriz`; `<HonestyNote />` fijo abajo (`position: fixed; bottom: 0`).
- **Metadatos**: título "Que Dice Mi Mascota — un juego", descripción honesta y breve.
- **Accesibilidad**: `<html lang="es">`, salto a contenido con enlace `.sr-only`, foco visible global (ya viene en `globals.css`).

### `app/components/Nav.tsx` — Barra de navegación
- **Objetivo**: mover al usuario entre **Inicio** (`/`) y **Mis traducciones** (`/historial`) y reflejar el atajo activo.
- **Layout**: `.navbar` con logo textual "🐾 Que Dice Mi Mascota" a la izquierda y `<nav>` con dos enlaces a la derecha. Enlace activo con `aria-current="page"` y subrayado.
- **Copy**:
  - Inicio · Mis traducciones
  - Pista al pie del logo: `muted text-sm` "Atajos: <kbd>R</kbd> otro guion · <kbd>N</kbd> nuevo video" (visible solo en `/resultado`, mediante prop).
- **Atajos** (handler global en `useEffect`):
  - `R` → si ruta `/resultado` y existe registro actual, regenera guion (mismo ánimo, otro banco).
  - `N` → vuelve a `/` y limpia contexto de video.
  - Si el foco está en un `<input>`/`<textarea>`/contenido editable, **ignorar** (no robar teclas).
- **Responsive**: nav se apila bajo el logo < 640px; los enlaces conservan tamaño táctil ≥ 40px.

### `app/components/HonestyNote.tsx` — Nota de honestidad (E9.1)
- **Objetivo**: recordar que es un juego sin IA real, en lenguaje claro, sin destruir la diversión.
- **Estructura**: banner inferior con `.alert-info`, fija, cierre manual (botón "Entendido" con `.btn-ghost .btn-sm`) que guarda preferencia en `localStorage` (`pref.honestyDismissed`) para no volver a salir en esa sesión.
- **Copy**:
  - Título: "Esto es un juego, no magia."
  - Cuerpo: "Inventamos el diálogo a partir de señales simples (movimiento, brillo, audio). No leemos la mente de tu mascota. Pero mola pasarla bien. 😉"
  - Botón: "Entendido"

---

## 1. ÉPICA 1 — Portada y carga del video

### `app/page.tsx` — Portada `/`
- **Objetivo para el usuario**: en 0–1 clics, tener un video listo para traducir.
- **Tarea principal y costo en clics**: **elegir video** → 1 clic si usa ejemplo, 2 si arrastra/abre selector (DropZone ya hace el resto). El botón **Traducir** aparece recién con video cargado y siempre es la única acción primaria.
- **Layout**:
  - `h1` "Que Dice Mi Mascota" + subtítulo `.subtitle` "Sube un video corto y le pondremos un doblaje inventado. Solo para reírnos."
  - `.stack` con: `DropZone`, ejemplos, botón webcam.
  - Tras cargar video: sección con `VideoPreview` + `EspecieSelector` + `PersonajeSelector` + `PistaSelector` + botón primario **Traducir** grande (`.btn-primary .btn-block`).
- **Defaults/presets cargados automáticamente** (para que se pueda **Guardar sin cambiar nada**):
  - Especie = la persistida en `localStorage`, si no → **Perro**.
  - Personaje = el persistido, si no → **Narrador solemne**.
  - Pista = "Mejor no te digo nada" (null) — seleccionada por defecto para no condicionar el guion si no hay pista clara.
- **Pickers acotados**: especie (toggle 2 opciones), personaje (5 tarjetas), pista (6 + 1 opción discreta). Sin inputs libres.
- **Opciones dependientes**: al elegir especie, los ánimos disponibles en `PersonajeSelector` se mantienen; la pista no restringe pero guía el tono del diálogo.
- **Avanzado escondido**: bajo un toggle "Mostrar más" mostrar pista solo si el usuario quiere hilar fino; por defecto la pista queda **visible** pero **no obligatoria** (su valor por defecto ya es válido).
- **Guía incorporada**:
  - Subtítulo de la pantalla: "Arrastra un video de 2 a 60 segundos o prueba con uno de los ejemplos."
  - Tooltips `.help-tip`:
    - En duración: `"Entre 2 y 60 segundos. Lo medimos al seleccionarlo."`
    - En ejemplos: `"Videos generados por nosotros. Un clic los analiza al instante."`
    - En webcam: `"Graba hasta 10 segundos desde tu cámara. Sin subir nada."`
- **Estados**:
  - Cargando video (validando duración): spinner corto + "Comprobando el video…"
  - Vacío: `DropZone` ya es la invitación por defecto.
  - Error de validación: `.alert-error` debajo del DropZone con mensaje humano:
    - "Ese archivo no es un video. Elige un .mp4, .webm, .mov o .m4v."
    - "El video dura menos de 2 segundos. Graba un poquito más."
    - "El video dura más de 60 segundos. Recorta un fragmento."
    - "No pudimos leer tu cámara. Usa arrastrar y soltar mientras tanto."
- **Responsive**: DropZone a 100% en móvil; ejemplos en `.grid .grid-sm-2 .grid-md-3`; al haber video, la `VideoPreview` ocupa ancho completo y los selectores van en `.grid .grid-sm-2`.

### `app/components/DropZone.tsx` — Zona de arrastre/soltar
- **Objetivo**: aceptar el video del usuario (arrastre o clic) y entregar un `File` válido al padre.
- **Layout**: `.card` grande, borde dashed grueso, alto mínimo 220px en escritorio / 160px en móvil; al hover/drag-over: borde sólido color marca y fondo `var(--surface-2)`.
- **Copy**:
  - Estado vacío: "Arrastra aquí tu video" (h1 interno) + "o haz clic para elegirlo" + texto pequeño "Mínimo 2 s, máximo 60 s".
  - Drag-over: "Suelta para empezar".
  - Con archivo: muestra nombre del archivo + tamaño; el padre hace el resto.
- **Validación (sin jerga visible)**:
  - Si no es video → "Ese archivo no es un video."
  - Si duración < 2 s → "Demasiado corto. Necesitamos al menos 2 segundos."
  - Si duración > 60 s → "Demasiado largo. Máximo 60 segundos."
  - Si duración `NaN`/`Infinity` (típico de `.webm` de `MediaRecorder`): forzar seek a `1e101` y reintentar (sin mostrar nada al usuario).
- **Acción principal única**: el propio DropZone (clic = abrir selector; soltar = validar).
- **Accesibilidad**: `role="button"`, `tabIndex={0}`, `aria-label="Elegir o arrastrar un video"`, activable con Enter/Espacio.

### `app/components/VideoPreview.tsx` — Vista previa en loop
- **Objetivo**: que el usuario vea su video y pueda reemplazarlo o quitarlo.
- **Layout**: `.card` con `<video autoplay muted loop playsinline>` (sin controles nativos), ancho máximo 480px, y debajo una `.cluster` con dos botones: **Quitar video** (`.btn-ghost`) y **Reemplazar** (`.btn-ghost`).
- **Copy**:
  - Botón "Quitar video" (tooltip `.help-tip` "Borra el video actual. Volverás a la zona de arrastre.")
  - Botón "Reemplazar" (tooltip "Elige otro video en su lugar.")
- **Estados**: si la URL del blob aún no está lista, texto "Preparando vista previa…" con `.muted text-sm`.

### `app/components/WebcamRecorder.tsx` — Grabación webcam
- **Objetivo**: capturar hasta 10 s desde la cámara sin subir nada.
- **Layout**: `.card` con `<video>` en vivo (espejado), botones según fase:
  - Antes: **Empezar a grabar** (`.btn-primary`).
  - Durante: cronómetro grande (`mm:ss`) + cuenta regresiva 3-2-1 superpuesta + **Detener** (`.btn-ghost`).
  - Después: **Usar este clip** (`.btn-primary`) y **Volver a grabar** (`.btn-ghost`).
- **Copy**:
  - Subtítulo: "Graba de 2 a 10 segundos. Se guarda solo en tu navegador."
  - Botón primario inicial: "Empezar a grabar"
  - Estados de error con `.alert-error`:
    - "No encontramos una cámara. Revisa que esté conectada."
    - "Necesitamos permiso para usar la cámara. Acepta el aviso del navegador."
    - "La grabación falló. Inténtalo otra vez."
- **Guía**: tooltip en el cronómetro: `"Cuando llegue a 0:10 se corta sola."`
- **Responsive**: video centrado, ancho completo hasta 480px; botones en `.cluster` que se apila < 480px.
- **A11y**: el `<video>` lleva `aria-label="Vista previa de la cámara"`; el cronómetro es un `aria-live="polite"` para usuarios de lector de pantalla.

---

## 2. ÉPICA 2 — La pista ("¿Qué estaba haciendo?")

### `app/components/PistaSelector.tsx` — Seis tarjetas + opción discreta
- **Objetivo**: captar una pista de contexto para condicionar el diálogo, sin obligar.
- **Layout**: pregunta grande `h2` "¿Qué estaba haciendo tu mascota?" y, debajo, una `.grid .grid-sm-2 .grid-md-3` con **6 tarjetas** (`.card` tocables). Una **7ª opción discreta** aparte: enlace pequeño `.btn-ghost .btn-sm` "Mejor no te digo nada".
- **Tarjetas (texto + emoji)**:
  - 👀 Me mira fijo
  - 🏃 Corre como loco
  - 🚪 Está en la puerta
  - 🍽️ Cerca de su plato
  - 😤 Lo acabo de retar
  - 😴 Recién despertó
- **Estados**: tarjeta seleccionada con borde `var(--brand)` y fondo `var(--surface-2)`; `aria-pressed="true"`; resto con borde normal. Hover: leve elevación (`box-shadow: var(--shadow)`).
- **Acción principal única**: tocar una tarjeta ya selecciona y queda listo para **Traducir** (no requiere confirmar).
- **Defaults**: nada seleccionado por defecto → equivale a "Mejor no te digo nada", que sí está marcado.
- **Avanzado escondido**: el texto "Con pista, el diálogo habla de esa situación" aparece solo al lado de la pregunta como `.help-tip` con `data-tip="Si eliges una, el guion girará alrededor de esa situación."`
- **Accesibilidad**: cada tarjeta es `<button>` con `aria-pressed`, navegación con flechas (estilo radio group), foco visible.

### `app/components/EspecieSelector.tsx` — Toggle perro/gato
- **Objetivo**: 1 clic para fijar la especie.
- **Layout**: `.field` con `<label>` "Especie" y un grupo de 2 botones tipo segmented (`.cluster` con dos `.btn`, uno `.btn-primary` y otro `.btn-ghost`).
- **Copy**: "🐶 Perro" · "🐱 Gato"
- **Persistencia**: `localStorage` (`pref.especie`). Se precarga al montar.
- **Acción principal única**: el propio toggle; al cambiar, los demás selectores no se invalidan.

### `app/components/PersonajeSelector.tsx` — 5 personajes
- **Objetivo**: definir el "tono" del doblaje.
- **Layout**: `.field` con `<label>` "Personaje"` y `.grid .grid-sm-2 .grid-md-3` con 5 tarjetas.
- **Tarjetas (emoji + nombre + línea ejemplo)**:
  - 🎙️ Narrador solemne — *"En las sombras del pasillo, algo se movía…"*
  - 📺 Telenovela — *"¡¿Cómo me puedes hacer esto, a mí?!"*
  - 👵 Abuela — *"Mi niño, comidita y a la camita…"*
  - 💪 Coach motivacional — *"¡Vamos! ¡Tú puedes! ¡Una más!"*
  - 😏 Sarcástico — *"Oh, genial. Otra vez tú."*
- **Estados**: seleccionada con borde marca; tooltip `.help-tip` en cada una con `data-tip="Ejemplo de estilo: ‘…’"`
- **Persistencia**: `localStorage` (`pref.personaje`). Default **Narrador solemne** la primera vez.
- **Acción principal única**: elegir tarjeta.

---

## 3. ÉPICA 3 — Analizando (el show)

### `app/analizando/page.tsx` — Pantalla de análisis `/analizando`
- **Objetivo**: hacer pasar al usuario de **Traducir** a **Resultado** con un mini espectáculo de 2,5–4 s.
- **Tarea principal**: esperar. Costo: 0 clics (es transición).
- **Layout**:
  - Fondo: `<canvas>` o `<video>` con un frame estático del video cargado y `filter: blur(8px); opacity: .6` (E3.3), con overlay oscuro suave.
  - Centro: `.card` semitransparente con título `h1` "Analizando a tu mascota…" y, debajo, la lista vertical de 4 `AnalysisStage` con su número, texto y spinner.
- **Copy por etapa** (E3.2):
  1. "Detectando a tu mascota"
  2. "Midiendo nivel de energía"
  3. "Escuchando vocalizaciones"
  4. "Escribiendo el guion"
- **Comportamiento**:
  - Las etapas se van marcando activas conforme avanza el progreso real + timer artificial para llenar el mínimo de 2,5 s.
  - Si el usuario llega sin video en contexto → redirigir a `/` (sin error visible, solo nav).
  - Al terminar: `router.push('/resultado')` (0 clics para el usuario).
- **Guía**: subtítulo `.muted` "Esto dura solo unos segundos."
- **A11y**: la lista de etapas usa `aria-live="polite"` para que el lector anuncie el avance.

### `app/analizando/components/AnalysisStage.tsx` — Una etapa
- **Objetivo**: una línea de la lista de progreso.
- **Layout**: `.cluster` con círculo numerado (`1`–`4`, color marca), texto descriptivo y spinner animado (CSS keyframes, sin librerías).
- **Estados**: `pendiente` (gris), `activa` (marca + spinner), `hecha` (check ✓ + `.badge-ok`).
- **A11y**: el conjunto lleva `role="status"` por etapa.

---

## 4. ÉPICA 4 — Resultado

### `app/resultado/page.tsx` — Pantalla resultado `/resultado`
- **Objetivo**: mostrar el doblaje y dar las acciones para guardar/compartir.
- **Tarea principal y costo en clics**: **ver el resultado** = 0 clics al llegar. **Cambiar personaje** = 1 clic. **Guardar video** = 1 clic. **Copiar diálogo** = 1 clic.
- **Layout**: `.stack` con:
  1. `ResultVideo` (video en loop + subtítulos sincronizados).
  2. Cabecera con **ánimo + emoji** (grande) y certeza-chiste (`badge`).
  3. `DialogoDisplay` (3–4 líneas grandes, efecto máquina de escribir).
  4. Bloque "Cómo llegué a esto" (detalle `.panel` con las señales, plegable).
  5. `PersonajeSelector` (para reescritura instantánea).
  6. `ButtonsBar` (acciones).
- **Copy principal**:
  - `h1`: "Tu mascota dice:"
  - Subtítulo: "Ánimo detectado: <emo> <nombre> · Certeza: <X>%".
  - Certeza-chiste (E4.3): si certeza < 60 → texto como `"Estoy 42% segura de esto. Pero me la juego."` y `.badge-warn`; si ≥ 85 → `"Estoy 91% segura. Casi que la escucho."` y `.badge-ok`.
  - Botón plegable "Cómo llegué a esto" → `.panel` con líneas cortas: "Se movió mucho (ráfagas altas) + audio leve = alerta de 'alguien en la puerta'".
- **Avanzado escondido**: "Cómo llegué a esto" y "Otra versión del guion" detrás de un toggle "Mostrar más".
- **Defaults/presets**: ya todo precargado (especie/personaje/pista del contexto).
- **Acción principal única**: **Guardar video** (`.btn-primary`). El resto de acciones son `.btn-ghost` o `.btn` (nunca dos primarias compitiendo).
- **Guía**: tooltip en personaje: `"Cambia el tono del doblaje. Lo reescribimos al instante, sin volver a analizar."`; tooltip en "Otra versión": `"Mismo ánimo, otro guion. Atajo: R."`
- **Estados**:
  - Cargando: `DialogoDisplay` y video aún sin sincronizar → texto suave "Preparando el doblaje…" (apenas perceptible, < 300 ms).
  - Vacío: redirige a `/`.
  - Error al guardar: `.alert-error` con reintento: "No pudimos guardar el video. Inténtalo otra vez."
  - Éxito tras guardar: micro-banner `badge-ok` "Video guardado en tu carpeta de descargas" (autocierre 3 s).
- **Responsive**: video a 100% del contenedor; el diálogo va encima del video en móvil y debajo en escritorio; botones en `.cluster` que se apila.

### `app/resultado/components/ResultVideo.tsx` — Reproductor con subtítulos quemados en preview
- **Objetivo**: reproducir el video en loop con subtítulos sincronizados visibles.
- **Layout**: `.card` con `<video autoplay muted loop playsinline>` posicionado relativo y subtítulos `<div>` superpuestos abajo (`.cluster` apilado, fondo semitransparente, fuente `var(--fs-lg)`, `text-shadow` para legibilidad).
- **Comportamiento**: la línea visible se calcula por la duración total entre líneas (E4.2); `aria-live="off"` para no interrumpir al lector.
- **A11y**: botón alternativo "Mostrar transcripción completa" (`.btn-ghost .btn-sm`) que abre `DialogoDisplay` abajo — útil para usuarios que no pueden leer subtítulos pequeños.

### `app/resultado/components/DialogoDisplay.tsx` — Diálogo escrito
- **Objetivo**: mostrar el guion con efecto máquina de escribir y temporizado.
- **Layout**: lista vertical; cada línea aparece al ritmo del video; fuente `var(--fs-lg)` o `var(--fs-xl)`; `font-weight: 600`; ancho máx. 720px.
- **Estados**: `escribiendo` (animación typewriter por línea, ~ 600 ms por línea), `completo` (sin más animación).
- **A11y**: contenedor con `role="region" aria-label="Diálogo completo"` que muestra el texto final aunque se desactive la animación (`prefers-reduced-motion: reduce` → mostrar todo de golpe).

### `app/resultado/components/ButtonsBar.tsx` — Barra de acciones (E4.5–E4.10)
- **Objetivo**: que el usuario actúe sobre el resultado en 1 clic por acción.
- **Layout**: `.cluster` con 6 botones. **Un solo botón primario** (`Guardar video`). El resto `.btn-ghost`.
- **Copy y verbos del dominio**:
  - 🎬 **Guardar video** (`.btn-primary`) → descarga `.webm` con subtítulos.
  - 🖼️ **Guardar imagen** → descarga un `.png` con el frame + diálogo.
  - 📋 **Copiar diálogo** → copia el texto al portapapeles.
  - 🔊 **Que lo diga** → reproduce con voz local (si hay `es-*`).
  - ✍️ **Otro guion** → atajo **R**, regenera.
  - ➕ **Traducir otro video** → atajo **N**, vuelve a `/`.
- **Tooltips `.help-tip`**:
  - "Que lo diga": `"Reproduce el diálogo con la voz de tu navegador. Si no suena, prueba instalar una voz en español."`
  - "Guardar imagen": `"Una imagen con el frame y el diálogo. Ideal para compartir."`
  - "Copiar diálogo": `"Copia el texto al portapapeles para pegarlo donde quieras."`
- **Feedback**:
  - Copiar: `badge-ok` "Diálogo copiado" (3 s).
  - Guardar: `badge-ok` "Guardado en tu carpeta de descargas" (3 s).
  - Voz: si no hay voz `es-*` → `.alert-info` "No hay voz en español disponible en este navegador. La instalación depende del sistema."
- **Confirmación destructiva**: ninguna aquí (no hay borrar). El botón "Otro guion" no requiere confirmación (es reversible y barato).

---

## 5. ÉPICA 5 — Historial

### `app/historial/page.tsx` — Grilla `/historial`
- **Objetivo**: revisar traducciones anteriores y entrar al detalle en 1 clic.
- **Tarea principal y costo en clics**: **abrir una traducción** = 1 clic.
- **Layout**:
  - `h1` "Mis traducciones" + subtítulo "Aquí están todas las que has hecho. Solo se guardan en tu navegador."
  - `.toolbar` con buscador (`Buscar por palabra del diálogo…`) y `<select>` filtro por especie (`Todas` / `Perro` / `Gato`).
  - Grilla `.grid .grid-sm-2 .grid-md-3 .grid-md-4` de `HistoryCard`.
  - Cada `HistoryCard` lleva un botón "Borrar" propio (`.btn-ghost .btn-sm`) — confirmar con `window.confirm` ("¿Borrar esta traducción? No se puede deshacer.").
- **Defaults**: ordenado por fecha descendente (ya por defecto). Filtros sin valor (Todas / vacío) → muestra todo.
- **Acción principal única**: hacer clic en una card abre el detalle.
- **Avanzado escondido**: filtro de fecha (rango) detrás de "Mostrar más" en el toolbar (no necesario en uso típico).
- **Estados**:
  - Cargando: "Cargando tus traducciones…" (texto, sin skeleton invasivo).
  - Vacío: `.empty-state` con copy **que enseña el primer paso**: "Aún no has traducido ningún video. Ve a Inicio y prueba con uno de los ejemplos." + botón `.btn-primary` "Ir a Inicio".
  - Error: `.alert-error` "No pudimos leer el historial. Revisa que tu navegador permita almacenamiento local." + botón "Reintentar".
  - Tras borrar: `badge-ok` "Traducción borrada".
- **A11y**: la grilla lleva `role="list"`; cada card es `<article>` con `aria-labelledby` apuntando a la fecha.

### `app/historial/components/HistoryCard.tsx` — Tarjeta individual
- **Objetivo**: vista previa de una traducción.
- **Layout**: `.card` con miniatura JPEG arriba (altura fija 140px, `object-fit: cover`), debajo una `.stack` corta: línea 1 (especie + ánimo + emoji, ej. "🐶 Perro · 🐾 Alerta"), línea 2 (personaje, ej. "Voz de: Narrador solemne"), línea 3 (fecha relativa: "hace 3 min", "ayer", "12 mar"). Esquina inferior derecha: botón "Borrar" (`.btn-ghost .btn-sm`).
- **Indicador de video disponible**: si `videoBlob` existe, una pequeña `.badge-ok` "Con video"; si no, `.badge` "Solo imagen".
- **Clic**: navega a `/historial/[id]`.
- **A11y**: card clicable como `<a>` que envuelve la tarjeta; botón Borrar con `aria-label="Borrar traducción del 12 de marzo"` (incluye contexto).

### `app/historial/[id]/page.tsx` — Detalle `/historial/[id]`
- **Objetivo**: revisar una traducción y reescribir el diálogo con otro personaje.
- **Layout**:
  - `h1` "Traducción del <fecha legible>" + botón "← Volver a Mis traducciones" (`.btn-ghost .btn-sm`).
  - Bloque con `ResultVideo` (si hay `videoBlob`) o, si no, la miniatura + el diálogo encima.
  - Cabecera: especie, ánimo + emoji, certeza, personaje actual.
  - `PersonajeSelector` para reescritura (mismo componente, misma lógica de `/resultado`).
  - Diálogo (lista con timing).
  - Panel "Cómo llegué a esto" con las señales (plegable).
  - Botón **Borrar esta traducción** (`.btn-danger`) abajo, con confirmación explícita.
- **Acción principal única**: reescribir con otro personaje = 1 clic sobre la tarjeta.
- **Avanzado escondido**: panel de señales (siempre plegable, abierto por defecto si la certeza < 70% para que el usuario entienda el "por qué").
- **Guía**:
  - Subtítulo: "Revisa, cambia el personaje o borra esta traducción."
  - Tooltips iguales a los de `/resultado`.
- **Estados**:
  - Cargando: "Cargando…"
  - No encontrado: `.empty-state` "No encontramos esa traducción." + botón "Volver".
  - Tras borrar: redirige a `/historial` con `badge-ok` "Traducción borrada".

---

## 6. ÉPICA 9 — Nota de honestidad
Cubierta en `HonestyNote.tsx` (sección 0). Sin pantalla propia.

---

## 7. ÉPICA 10 — Matriz de prueba

### `app/matriz/page.tsx` — Matriz `/matriz`
- **Objetivo**: demostrar visualmente que señales distintas producen ánimos distintos (criterio de aceptación #4).
- **Tarea principal y costo en clics**: leer. 0 clics. La tabla ya está resuelta.
- **Layout**:
  - `h1` "Cómo combinamos las señales"` + subtítulo "Esta tabla muestra ejemplos de cómo señales medidas se traducen en ánimos. Es solo una prueba visual."
  - `.table-wrap` con `.table`: **2 filas** (Perro, Gato) × **6 columnas** (ánimos). Cada celda: nombre del ánimo + emoji + 1–2 datos clave (ej. "mov. alto · audio medio"). Sinogramas ≤ 7 columnas visibles (regla back-office).
  - Leyenda inferior `.muted text-sm` con la fórmula: "Movimiento × ráfagas × brillo × zona × audio × duración → ánimo."
- **Avanzado escondido**: una fila extra "Detalle de señales" detrás de un toggle "Mostrar números" — al activarlo, cada celda muestra los 6 valores simulados (mov/rafaga/brillo/zona/audio/duración) en una mini-lista `.text-sm .muted`.
- **Guía**: tooltip en el título: `"Aquí se ve por qué dos videos diferentes pueden terminar en ánimos distintos."`
- **Estados**: cargando simulado = no (datos ya disponibles); sin estado vacío posible (es contenido estático).
- **Accesibilidad**: `<th scope="row">` para especie; `<th scope="col">` para ánimos; caption oculto `.sr-only` "Matriz de ánimos por especie".
- **Footer / pie global**: enlace "← Volver al inicio" (`.btn-ghost .btn-sm`).

---

## 8. Resumen de patrones recurrentes

| Patrón | Dónde aparece | Cómo se ve |
|---|---|---|
| Subtítulo de propósito (`.subtitle`) | Toda pantalla con `h1` | Una línea en `var(--text-muted)` que explica para qué sirve |
| Tooltips `.help-tip` | Controles no obvios | Burbuja con clase del design system, ejemplo concreto |
| `badge-ok/-warn/-danger/-info` | Estados de análisis, certeza, vacíos | Mismo color = mismo significado en toda la app |
| `.empty-state` con CTA | Historial, detalle no encontrado | Enseña el primer paso, no solo "no hay datos" |
| `.alert-error` con reintento | Validación DropZone, webcam, IndexedDB | Lenguaje humano + acción posible |
| `kbd` con atajos | Nav + Resultado | R y N visibles donde aplica |
| Banner inferior HonestyNote | Todas | `.alert-info` con cierre manual |

---

## 9. Atajos de teclado (regla única, recordar global)

| Tecla | Pantalla | Acción |
|---|---|---|
| `R` | `/resultado` (con registro) | Otro guion del mismo ánimo |
| `N` | `/resultado` | Volver a Inicio y limpiar contexto |
| `Esc` | Cualquier overlay abierto | Cerrar (DropZone drag-over, HonestyNote si reabierta) |
| `Enter`/`Espacio` | DropZone, tarjetas focuseadas | Activar botón/tarjeta |

Implementación en `Nav.tsx` con un único `useEffect` que escucha `keydown`, ignorando cuando el target es `INPUT`/`TEXTAREA`/`[contenteditable]`.

---

## 10. Estados compartidos y memoria entre páginas

- `app/components/VideoContext.tsx`: estado global (`videoFile`, `blobUrl`, `señales`, `resultado`, `registroActual`). Lo consumen `app/page.tsx`, `app/analizando/page.tsx`, `app/resultado/page.tsx`.
- Si el usuario entra a `/analizando` o `/resultado` sin video en contexto → `router.replace('/')` sin error visible (suave).
- El historial vive en IndexedDB y se carga bajo demanda en `/historial` y `/historial/[id]`; nada se cachea en contexto.

---

## 11. Accesibilidad transversal (checklist por pantalla)

- Todo `<input>` con `<label htmlFor>` (no se usan inputs libres en esta app; los selectores son botones/tarjetas).
- Botones con texto visible; iconos emoji acompañan, no reemplazan.
- Contraste: textos sobre fondos claros/oscuros validados con tokens.
- Foco visible global (ya en `globals.css`).
- `prefers-reduced-motion`: animaciones de análisis y typewriter se reemplazan por transición instantánea.
- Navegación con teclado en todos los flujos (incluye tarjetas tipo radio group para pista y personaje).
- Lectores de pantalla: `aria-live` en cronómetro webcam y etapas de análisis; `aria-current="page"` en nav; `aria-pressed` en tarjetas seleccionables.
