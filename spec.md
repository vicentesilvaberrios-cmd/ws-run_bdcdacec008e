# Spec — Que Dice Mi Mascota (prototipo desktop Web)

## 1. Objetivo y alcance

### 1.1 Resumen del producto
Aplicación web de escritorio (Windows, Chrome o Edge) llamada **Que Dice Mi Mascota**: el
usuario sube un video corto de un perro o un gato y la app le pone **subtítulos inventados** de
lo que el animal "estaría diciendo", como doblaje de película. Es un juego, sin ninguna
pretensión científica. Es un **prototipo para validar la idea** antes de una versión para
celular: lo que más importa es que dé risa y que la gente quiera mostrarlo.

### 1.2 Restricciones duras (no negociables, son el punto del prototipo)
1. **CERO servicios externos**: no Supabase ni ninguna base de datos externa, no carpeta
   `migrations/`, no archivos `.sql`, no lectura de `process.env`. La app arranca sin configurar nada.
2. **CERO IA externa**: ninguna llamada a APIs de modelos de lenguaje o visión, ninguna clave de
   API. Todo el análisis se calcula en el navegador con código propio (heurística determinista).
3. **CERO red en tiempo de ejecución**: ninguna petición después de cargar la página. Nada de
   Google Fonts, CDN, imágenes/scripts remotos ni analítica. Debe funcionar con el wifi apagado.
4. **SIN backend propio**: nada de API routes (`app/api/*`) ni server actions ni server components
   que toquen red o disco. Todo corre en el cliente.
5. **Corre local en Windows con Node 24**: `npm install` + `npm run dev` levantan la app en
   `http://localhost:3000`; `npm run build` compila sin errores. Pasos documentados en README.
6. **SIN login ni cuentas**: historial en **IndexedDB**, preferencias en **localStorage**.

### 1.3 Stack
- Next.js (App Router) + TypeScript, todo del lado del cliente (componentes `'use client'`).
- Dependencias de runtime **mínimas**: si algo se resuelve con una API del navegador, se usa esa
  API: `canvas`, `AudioContext`, `IndexedDB`, `MediaRecorder`, `speechSynthesis`, `getUserMedia`,
  `URL.createObjectURL`. Sin librerías de UI, sin procesamiento externo de video/imagen/audio.

### 1.4 Persistencia (decisión única por dato)
- **IndexedDB** (base `que-dice-mi-mascota`): historial de traducciones (registros + miniaturas
  JPEG + blobs de video). Es la fuente de verdad del historial; sobrevive a recargar y cerrar el navegador.
- **localStorage**: preferencias — personaje elegido (persistido), especie por defecto, última
  pista usada, preferencia de voz para `speechSynthesis`.
- No se usa localStorage para el historial ni IndexedDB para preferencias: cada dato tiene una
  sola fuente de verdad. Nunca se persiste en archivos del filesystem (no sqlite, no JSON en disco).

### 1.5 En alcance (resumen)
Portada con arrastre y 3 ejemplos incluidos; webcam (2–10 s); especie/personaje/pista; análisis
determinista (movimiento/ráfagas/brillo/zona/audio/duración); pantalla de análisis con 4 etapas;
resultado con diálogo multi-línea sincronizado, ánimo, certeza-chiste y "cómo llegué a esto", 5
personajes, voz, guardar video (.webm)/imagen (PNG), copiar diálogo, "otro guion" (R) y "traducir
otro video" (N); historial (grilla, detalle, borrado); página/test de matriz; nota de honestidad;
README de instalación en Windows con Node 24.

### 1.6 Fuera de alcance
Login y cuentas; base de datos o backend; sincronización entre dispositivos; reconocimiento real
de razas/mascota; modelos de visión o audio; feed social o ranking; notificaciones; pagos;
especies distintas de perro y gato; análisis en vivo sin grabar; empaquetado de escritorio o
celular; PWA; panel de administración; páginas "Acerca de"/"Ayuda"/"Ajustes" separadas (la pista,
los personajes y los atajos se explican en contexto dentro del flujo).

---

## 2. Épicas y funcionalidades

### ÉPICA 1 — Portada y carga del video
**E1.1** Título con gracia y una sola idea visual dominante: la zona grande para arrastrar el
video, centrada. Sin listas numeradas de instrucciones ni tooltips de "?"; la pantalla se explica sola.
**E1.2** Zona de arrastre/soltar (`video/*`). También clic para abrir el selector de archivos.
**E1.3** Validación inmediata del archivo:
- Acepta `video/*` (por MIME; si el tipo llega vacío, decide por extensión `.mp4`, `.webm`, `.mov`, `.m4v`).
- Rechaza duración < 2 s o > 60 s con mensaje claro.
- Si la duración reportada **no es finita** (`NaN`/`Infinity`, pasa con casi todo `.webm` de
  `MediaRecorder`): **no rechazar** — forzar la lectura con `currentTime = 1e101` y esperar
  `seeked` antes de releer `video.duration`.
**E1.4** "Pruébalo con un ejemplo": **tres videos de ejemplo en el repo** (< 1 MB c/u, generados
vía canvas o sin derechos de terceros): mancha muy movida, casi quieta e intermedia. Un clic
analiza al instante (sin pasar por la pista).
**E1.5** Botón secundario "Grabar con la webcam": `getUserMedia` + `MediaRecorder`, máx. 10 s,
mín. 2 s, cuenta regresiva y corte automático. Sin cámara o permiso denegado → mensaje claro y el
camino de arrastrar sigue disponible.
**E1.6** Controles (especie, personaje, pista) aparecen **después** de tener video cargado, no
antes. Un solo botón primario grande: **"Traducir"**.
**E1.7** Previsualización en loop mudo con opción de quitar/reemplazar el video.

### ÉPICA 2 — La pista ("¿Qué estaba haciendo?")
**E2.1** Una sola pregunta, grande, con **seis tarjetas ilustradas y tocables**: Me mira fijo ·
Corre como loco · Está en la puerta · Cerca de su plato · Lo acabo de retar · Recién despertó.
**E2.2** Opcional: **séptima opción discreta "mejor no te digo nada"** (equivale a sin pista).
**E2.3** La pista es una dimensión más de selección de frases: **con pista, el diálogo SIEMPRE
habla de esa situación**; sin pista, banco general. Va destacada y visible (no escondida).

### ÉPICA 3 — Analizando (el show)
**E3.1** Duración de 2,5 a 4 s, parte del espectáculo.
**E3.2** Cuatro etapas en orden: "Detectando a tu mascota" → "Midiendo nivel de energía" →
"Escuchando vocalizaciones" → "Escribiendo el guion".
**E3.3** De fondo, un frame del video con blur.
**E3.4** Si termina antes, igual se muestran todas; si demora más de 4 s, feedback permanente.
**E3.5** Al terminar, navega a Resultado.

### ÉPICA 4 — Resultado (la pantalla estrella)
**E4.1** Dos columnas desde 1024 px; apiladas en pantallas más angostas.
**E4.2** Video en **loop silencioso** con **diálogo de 3 o 4 líneas** como subtítulos de película,
sincronizados con los momentos de más movimiento/sonido: primera línea inmediata; siguientes
ancladas a los instantes de mayor energía/audio (según `Señales`); si el video dura < 4 s, 2
líneas bastan. Es una escena, no una frase única.
**E4.3** Panel derecho: emoji y nombre del ánimo; certeza-chiste explícita ("87% seguro, me lo
invento pero con convicción"); bloque **"Cómo llegué a esto"** con los datos REALES medidos en
lenguaje humano (movimiento, ráfagas, sonidos contados, duración, día/noche) — siempre los números
reales, incluso bajos.
**E4.4** **CINCO PERSONAJES** como chips siempre visibles: 🎙️ Narrador de documental, 📺
Telenovela, 🧓 Abuela chilena, 💪 Coach motivacional, 😏 Sarcástico. Tocar uno **reescribe el
diálogo al instante** sin reanalizar (solo `escribirDialogo` con nueva semilla-personaje). El
elegido se **recuerda** (localStorage).
**E4.5** "Que lo diga": `speechSynthesis` (local, sin red); voz aguda y rápida para gato, grave y
lenta para perro. Sin voces es-* → el botón **no se muestra**.
**E4.6** "Guardar video": quema subtítulos con `canvas` + `MediaRecorder` y descarga `.webm` reproducible.
**E4.7** "Guardar imagen": PNG 1080×1080 con el frame y la primera línea.
**E4.8** "Copiar el diálogo": al portapapeles con indicación de éxito.
**E4.9** "Otro guion" (atajo **R**): otro diálogo del **mismo ánimo** sin repetir el anterior
(variando semilla e incrementando `indice`).
**E4.10** "Traducir otro video" (atajo **N**): vuelve a la portada (limpia video, conserva preferencias).
**E4.11** El resultado se guarda **automáticamente** en el historial.

### ÉPICA 5 — Historial ("Mis traducciones")
**E5.1** Grilla de tarjetas: miniatura, emoji del ánimo, primera línea del diálogo, fecha relativa.
**E5.2** Tocar una tarjeta abre el detalle con el video si sigue guardado; si el blob se purgó, se
muestra sin video (miniatura + diálogo completo + desglose).
**E5.3** Borrar una (con confirmación) y **borrar todo** (con confirmación).
**E5.4** Estado vacío con guía para crear la primera traducción.
**E5.5** IndexedDB: un registro por traducción con señales y miniatura JPEG ≤ 40 KB; el blob de
video solo en las **últimas 10** traducciones.

### ÉPICA 6 — El motor (determinista, 100% en el navegador)
**E6.1** Módulo aislado **sin React**: `lib/analisis.ts`, única superficie para la UI:
- `analizarVideo(fuente) -> Señales`
- `clasificar(señales, especie) -> {animo, certeza}`
- `escribirDialogo(animo, especie, personaje, pista, señales, semilla, indice) -> string[]`

Swap de heurística por modelo local sin tocar pantallas.
**E6.2** Señales (≥ **16 frames parejos** en canvas **160×120**, esperando `seeked` antes de dibujar):
- **MOVIMIENTO**: % de píxeles que cambian entre frames consecutivos: gris, contar fracción que
  cambia > **18 niveles** de 255; promediar; 0–100. **Prohibido** usar la diferencia absoluta
  promedio de todos los píxeles (nunca pasa de 10 y deja ciego al clasificador).
- **RÁFAGAS**: tramos que superan 2× el movimiento promedio (saltos y arranques).
- **BRILLO** medio (día/noche) y **ZONA** del movimiento (centro = te encara; bordes = anda en lo suyo).
- **AUDIO**: `AudioContext`; pico y RMS normalizados a 0–100; **eventos sonoros** (picos sobre
  umbral separados ≥ 300 ms, permite "ladró 3 veces"). Sin audio o no decodificable → **no falla**:
  clasifica con movimiento y duración y lo dice.
- **DURACIÓN** en segundos.
**E6.3** Clasificación (cortes documentados en comentario, calibrados para la métrica de % de píxeles):
- Movimiento bajo < 8; medio 8–25; alto > 25. Voz baja/media/alta según pico y RMS.
- Matriz explícita por especie, seis estados de ánimo:

| Movimiento | Voz | PERRO | GATO |
|---|---|---|---|
| alto | alta | Eufórico | Exigiendo algo ya |
| alto | baja | Juguetón | En modo cacería |
| medio | alta | Alerta | Conversador |
| medio | baja | Curioso | Evaluándote |
| bajo | alta | Quejándose | Reclamando comida |
| bajo | baja | En modo zen | Zen absoluto |

**E6.4** **Certeza honesta**: sube con la nitidez (distancia al corte más cercano) y baja con
señales pobres. **Nunca más de 80%** si movimiento bajo y sin audio. Prohibido premiar estar lejos
del promedio (daría el máximo cuando no se midió nada).
**E6.5** **Señales pobres** (movimiento casi nulo + sin audio): no inventar ánimo; resultado-chiste
"No se movió, no opinó, no aportó. Diagnóstico: gato" + consejo de captura (acércate, graba ~8 s,
deja que se escuche). Divertido y honesto.

### ÉPICA 7 — El guion (`lib/frases.ts`)
**E7.1** Banco por **especie × ánimo × personaje × (con/sin pista)**, **≥ 4 líneas por combinación**.
**E7.2** Líneas ≤ 110 caracteres, primera persona desde la mascota, español de Chile con tuteo, sin
groserías; nunca "vos", nunca "usted".
**E7.3** **Al menos la mitad de las líneas** usan marcadores con datos medidos: `{ladridos}`,
`{segundos}`, `{momento}` (de día/de noche), `{rafagas}`.
**E7.4** Ejemplos de referencia: Perro/Eufórico/Sarcástico: "Ladré {ladridos} veces en {segundos}
segundos y ninguna fue por algo real." · Gato/Zen/Narrador: "El felino lleva {segundos} segundos
sin moverse. Es su obra maestra." · Perro/Alerta/Telenovela: "Escuché algo. Puede ser el cartero.
Puede ser mi destino." · Gato/Reclamando/Abuela: "Mijito, sírvame no más, si yo no pido nada." ·
Perro/Juguetón/Coach: "{rafagas} explosiones de energía. Eso no se entrena, eso se nace."
**E7.5** Personajes bien diferenciados: narrador en 3ª persona y solemne; telenovela exagera la
traición; abuela ofrece comida y preocupación; coach convierte todo en superación; sarcástico desinfla.

### ÉPICA 8 — Diseño y accesibilidad
**E8.1** Divertido, colorido, tipografía grande y aire; contenido centrado, máx. 1200 px.
**E8.2** Animaciones suaves al pasar a resultado; hover y foco visibles; todo con teclado.
**E8.3** Bien a 400 px de ancho (base de la versión celular): apilado, tipografía responsive, controles tocables.
**E8.4** Español de Chile, tuteo consistente.

### ÉPICA 9 — Honestidad
**E9.1** Línea discreta pero visible en **todas las vistas**: "Esto es un juego, no ciencia: el
guion se inventa a partir del movimiento y el sonido del video. Si te preocupa la salud o la
conducta de tu mascota, consulta a un veterinario."
**E9.2** En ningún texto se promete que la traducción sea real.

### ÉPICA 10 — Verificación de la matriz (criterio 4)
**E10.1** Página de prueba o test con **señales simuladas** que demuestre que las **12
combinaciones especie × celda** son alcanzables.
**E10.2** Página: enlace discreto en el pie que muestra la tabla de entradas simuladas y salidas
`{animo, certeza}`. Test: `npm test` lo ejecuta.

---

## 3. Modelo de datos

No hay base de datos externa. El "modelo" vive en el cliente.

### 3.1 `Señales` (en `lib/tipos.ts`)
| Campo | Tipo | Descripción |
|---|---|---|
| `movimiento` | number (0–100) | % de píxeles que cambian entre frames (métrica de E6.2) |
| `rafagas` | number | tramos que superan 2× el movimiento promedio |
| `brillo` | number (0–255) | brillo medio del video |
| `zona` | `'centro' \| 'bordes' \| 'indeterminada'` | dónde ocurre el movimiento |
| `pico` | number (0–100) \| `null` | pico de audio normalizado; `null` si sin audio |
| `rms` | number (0–100) \| `null` | RMS de audio normalizado; `null` si sin audio |
| `eventosSonoros` | number \| `null` | eventos sonoros separados ≥300 ms; `null` si sin audio |
| `duracion` | number | duración en segundos |
| `sinAudio` | boolean | `true` si no había audio o no se pudo decodificar |
| `frames` | number | frames realmente analizados (≥16 esperado) |

### 3.2 Resultado de clasificación
| Campo | Tipo | Descripción |
|---|---|---|
| `animo` | `Animo` (unión de los 6 por especie) | estado de ánimo detectado |
| `certeza` | number (0–100) | certeza honesta (E6.4) |
| `lecturaPobre` | boolean | `true` si se activó "no pude leer nada" (E6.5) |

`Animo` (perro): `'eufórico' | 'jugueton' | 'alerta' | 'curioso' | 'quejandose' | 'zen'`.
`Animo` (gato): `'exigiendo' | 'caceria' | 'conversador' | 'evaluandote' | 'reclamando' | 'zen-absoluto'`.

### 3.3 Tipos de dominio
| Tipo | Valores |
|---|---|
| `Especie` | `'perro' \| 'gato'` |
| `Personaje` | `'narrador' \| 'telenovela' \| 'abuela' \| 'coach' \| 'sarcastico'` |
| `Pista` | `'mirando' \| 'corriendo' \| 'puerta' \| 'plato' \| 'retado' \| 'desperto' \| null` (null = "mejor no te digo nada") |

### 3.4 `RegistroTraduccion` (registro en IndexedDB)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | único (`crypto.randomUUID()` o contador local) |
| `creadoEn` | number | timestamp (epoch ms) |
| `especie` | `Especie` | especie elegida |
| `personaje` | `Personaje` | personaje del diálogo guardado |
| `pista` | `Pista` | pista usada o `null` |
| `animo` | `Animo` | ánimo resultante |
| `certeza` | number | certeza de la clasificación |
| `lecturaPobre` | boolean | si fue resultado de señales pobres |
| `señales` | `Señales` | señales medidas (copia serializada) |
| `dialogo` | string[] | líneas del diálogo guardado |
| `miniatura` | Blob (JPEG ≤ 40 KB) | miniatura del frame |
| `videoBlob` | Blob (webm/mp4) \| `null` | blob de video (solo últimas 10) |
| `duracion` | number | duración (para re-sincronizar subtítulos) |
| `ancho` / `alto` | number | dimensiones del video original |

### 3.5 IndexedDB — esquema
- Base `que-dice-mi-mascota` (v1). Almacén `traducciones` (keyPath `id`; índice `creadoEn`).
- Blobs dentro del mismo registro (IndexedDB soporta Blob en Chrome/Edge).

### 3.6 localStorage — preferencias
`pref.personaje`, `pref.especie`, `pref.pista`, `pref.voz`. Cargadas al montar; escritas al cambiar.

### 3.7 Relaciones
- Sin entidades relacionales: cada registro es autocontenido (emoji/nombre de ánimo se derivan vía
  tablas constantes). El personaje guardado es el del momento; el detalle puede reescribir el
  diálogo con otro personaje sin modificar el registro (E4.4).

---

## 4. Rutas / páginas (App Router)

Todo bajo `'use client'` (salvo el layout raíz mínimo).

| Ruta | Archivo | Pantalla |
|---|---|---|
| `/` | `app/page.tsx` | Portada (Épica 1): arrastre, ejemplos, webcam, controles, "Traducir" |
| `/analizando` | `app/analizando/page.tsx` | Análisis con 4 etapas (Épica 3) |
| `/resultado` | `app/resultado/page.tsx` | Resultado (Épica 4) |
| `/historial` | `app/historial/page.tsx` | "Mis traducciones" (Épica 5) |
| `/historial/[id]` | `app/historial/[id]/page.tsx` | Detalle de una traducción |
| `/matriz` | `app/matriz/page.tsx` | Página de prueba de la matriz (Épica 10; enlace en el pie) |

Notas:
- `/analizando` y `/resultado` redirigen a `/` sin video en curso (estado en memoria/sesión del cliente).
- Layout raíz: nota de honestidad (E9.1), nav (Inicio / Mis traducciones), pie con enlace a `/matriz`.
- `app/globals.css`: variables de color, tipografía del sistema (sin fuentes remotas), layout responsive (máx. 1200 px), foco visible.

---

## 5. Endpoints API

**No hay endpoints.** No existe `app/api/*`, ni server actions, ni `fetch` en runtime. Todo en el
navegador. Funciona 100% offline tras cargar `/` (assets e ilustraciones en el bundle).

---

## 6. Criterios de aceptación (verificables)

1. `npm install` y `npm run dev` levantan la app en Windows con Node 24 sin configurar nada; `npm run build` compila sin errores de TypeScript.
2. Funciona con wifi apagado y sin peticiones a ningún dominio externo (DevTools → Network).
3. El repo no tiene Supabase, ni `migrations/`, ni `.sql`, ni `process.env`, ni claves de API.
4. Un video muy movido y uno casi estático dan ánimos **DISTINTOS**; la página/test demuestra las 6 celdas con señales simuladas (E10).
5. Analizar un video de ejemplo desde la portada toma un clic (E1.4).
6. Con pista, el diálogo menciona esa situación (E2.3).
7. Cambiar de personaje reescribe el diálogo al instante, sin reanalizar (E4.4).
8. Al menos la mitad de las líneas citan un dato real medido (E7.3).
9. Con señales pobres aparece "no pude leer nada", no un ánimo con certeza alta (E6.5).
10. Un `.webm` de MediaRecorder se acepta al arrastrarlo (duración no finita, E1.3).
11. "Guardar video" descarga un `.webm` reproducible con subtítulos (E4.6).
12. Mismo video + personaje + pista → siempre el mismo guion (determinismo).
13. El historial sobrevive a recargar y cerrar el navegador (IndexedDB).
14. Todo con teclado y los atajos **R** y **N** funcionan.

---

## 7. Flujos de usuario críticos (camino feliz, por rol)

**Rol 1 — Visitante con un video propio (rol principal).**
*Flujo central del negocio: DEBE poder crear una traducción de punta a punta desde la navegación.
Si falla, la app fracasa aunque todo lo demás funcione. Criterio derivado obligatorio: el flujo
completo (video → Traducir → análisis → Resultado → historial) se completa sin salir de la app.*

1. Abre `http://localhost:3000`; ve título y zona grande de arrastre.
2. Arrastra (o elige) un video de 2–60 s; valida (E1.3).
3. Ve la previsualización y los controles (E1.6).
4. Elige especie (`perro`/`gato`), personaje (persistido, E4.4) y la pista con una de las seis
   tarjetas o "mejor no te digo nada" (Épica 2).
5. Pulsa **"Traducir"**.
6. Ve las 4 etapas del análisis (~2,5–4 s) con blur de fondo (Épica 3).
7. Llega a Resultado: video en loop con diálogo sincronizado de 3–4 líneas, ánimo con emoji,
   certeza-chiste y "Cómo llegué a esto" (Épica 4).
8. Toca otro personaje → reescribe al instante. Toca **R** → otro guion del mismo ánimo. (Opcional)
9. "Que lo diga" → voz local (si hay voz es-*). (Opcional)
10. "Guardar video"/"Guardar imagen"/"Copiar el diálogo" para compartir. (Opcional)
11. El registro quedó solo en el historial (E4.11); con **N** o el nav se ve en "Mis traducciones"
    (miniatura, emoji, primera línea, fecha relativa) (Épica 5).

**Rol 1b — Visitante SIN video a mano (ver la gracia en dos segundos).**
1. Abre la portada. 2. Un clic en un video de ejemplo. 3. Analiza al instante y llega a Resultado
(E1.4, criterio 5). 4. Cambia de personaje y ve cómo cambia el chiste.

**Rol 1c — Visitante que graba con webcam.**
1. Pulsa "Grabar con la webcam" (E1.5). 2. Permiso; si no hay cámara o se niega, mensaje claro y el
arrastre sigue disponible. 3. Cuenta regresiva, grabación hasta el corte automático (2–10 s) y el
clip entra como video cargado. 4. Continúa desde el paso 3 del Rol 1 hasta "Traducir".

---

## 8. Estructura del repo y assets (guía de implementación)

- `app/` — rutas de §4 (cada una con su `page.tsx` `'use client'`, más `layout.tsx` y `globals.css`).
- `lib/` — `analisis.ts` (motor, sin React), `frases.ts` (banco), `tipos.ts` (tipos de §3),
  `almacen.ts` (IndexedDB), `audio.ts`/`video.ts` (helpers de canvas/audio/MediaRecorder si se separan).
- `public/` — los tres videos de ejemplo (`.webm`/`.mp4`, < 1 MB cada uno, con miniatura estática
  opcional), todo servido localmente; nada remoto.
- `README.md` — pasos para Windows + Node 24: `npm install`, `npm run dev`, `npm run build`;
  nota de que no requiere configuración, backend ni red.
- `package.json` — dependencias de runtime mínimas; scripts `dev`, `build`, `start`; opcional `test`
  para la verificación de la matriz.