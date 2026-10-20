# 🐾 Que Dice Mi Mascota

Aplicación web: sube un video corto de tu perro o gato y le ponemos un doblaje
inventado, con subtítulos sincronizados. Es un juego: no hay IA real, solo heurísticas
sencillas (movimiento, brillo, audio) y un banco de frases.

---

## ⚙️ Requisitos

- **Windows 10/11**
- **Node.js 24** (incluye npm). Descárgalo desde https://nodejs.org/.
- Navegador moderno (Chrome, Edge, Firefox). Para grabar desde la webcam necesitas
  Chrome o Edge.

Para comprobar tu versión:

```powershell
node --version
npm --version
```

---

## 🚀 Instalación y arranque (Windows)

```powershell
# 1) Abre la carpeta del proyecto y entra en ella
cd ruta\al\proyecto

# 2) Instala dependencias
npm install

# 3) Inicia el servidor de desarrollo
npm run dev
```

Abre http://localhost:3000 en tu navegador.

### 🏗️ Compilar para producción

```powershell
npm run build
npm start
```

El servidor arrancará en producción (por defecto, puerto 3000).

---

## 🎬 Cómo se usa

1. **Inicio** → arrastra un video de tu mascota (2–60 s), graba con la webcam o
   prueba con un ejemplo.
2. Elige **especie**, **voz** del doblaje y una **pista** (opcional).
3. Pulsa **Traducir**. Verás una animación con 4 etapas (~3 s).
4. En la pantalla de **resultado** puedes:
   - Ver el video con subtítulos sincronizados.
   - Leer el diálogo completo.
   - Cambiar la voz del doblaje (sin volver a analizar).
   - **Guardar video** (.webm), **Guardar imagen** (.png), **Copiar diálogo**,
     **Que lo diga** (voz del navegador), **Otro guion** (atajo `R`),
     **Traducir otro video** (atajo `N`).
5. **Mis traducciones** guarda el historial en tu navegador
   (IndexedDB; los videos se mantienen solo para las últimas 10).

### ⌨️ Atajos

- `R` → otro guion (mismo ánimo, otra versión).
- `N` → traducir otro video.

> Estos atajos no se activan si estás escribiendo en un campo.

---

## 📁 Estructura

- `app/` — UI Next.js (App Router).
  - `componentes/`, `analizando/`, `resultado/`, `historial/`, `matriz/`.
- `src/lib/` — lógica pura (analizador, diálogo, IndexedDB, etc.).
- `public/videos/` — 3 videos de ejemplo generados por `scripts/generar-ejemplos.mjs`.
- `scripts/generar-ejemplos.mjs` — build script para los videos de ejemplo.

### Regenerar los videos de ejemplo

```bash
node scripts/generar-ejemplos.mjs
```

> La app también genera videos de ejemplo en el navegador la primera vez que los
> necesitas (ver `src/lib/ejemplos.ts`). Los archivos en `public/videos/` son una
> copia fija del build.

---

## 🧪 Matriz de prueba

Visita `/matriz` para ver las 12 celdas (perro × 6 ánimos y gato × 6 ánimos) que
demuestran cómo señales distintas producen ánimos distintos.

---

## 🧠 Nota de honestidad

Esta app **no usa IA real**. Las "traducciones" se generan combinando plantillas
de frases con mediciones simples del video (movimiento, brillo, audio). Es un juego,
no magia. 😉