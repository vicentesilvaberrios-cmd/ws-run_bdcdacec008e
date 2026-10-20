// Analizador determinista — sin IA, pura heurística en el navegador.
// Muestrea el video con <video> + canvas + AudioContext. Devuelve Señales y Clasificación.
//
// Diseño:
// - Lee el blob como object URL, lo monta en un <video> y un AudioContext.
// - Toma N muestras de cuadros a lo largo de la duración, comparando diferencias de píxeles
//   para movimiento, brillo medio, posición del "blanco" (mascota) en X, etc.
// - Cuenta ráfagas: picos de movimiento por encima de la mediana.
// - Mide RMS de audio en cada muestra.
// - Deduce ánimo por umbrales estables (ver tabla al final).
// - Devuelve certeza honesta: con señales pobres baja + lecturaPobre=true.

import type {
  Animo,
  AnimoGato,
  AnimoPerro,
  Clasificacion,
  Especie,
  Senales,
} from './tipos';

const MUESTRAS = 12; // número de cuadros muestreados a lo largo del video.
const UMBRAL_RUPTURA = 0.12; // diferencia media entre frames que cuenta como ráfaga.

// ---------- Utilidades de muestreo de cuadro ----------

interface MuestraFrame {
  diff: number; // movimiento (0..1)
  brillo: number; // 0..255
  centroX: number; // 0..1
}

async function muestrearVideo(video: HTMLVideoElement): Promise<{
  muestras: MuestraFrame[];
  duracion: number;
  ancho: number;
  alto: number;
}> {
  const duracion = isFinite(video.duration) && video.duration > 0
    ? video.duration
    : 10; // fallback razonable si no se pudo leer

  const w = video.videoWidth || 320;
  const h = video.videoHeight || 240;
  const canvas = document.createElement('canvas');
  canvas.width = 96; // downsample para velocidad
  canvas.height = 54;
  const ctxOrNull = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctxOrNull) throw new Error('Canvas no disponible');
  const ctx: CanvasRenderingContext2D = ctxOrNull;

  const muestras: MuestraFrame[] = [];
  let prev: Uint8ClampedArray | null = null;

  for (let i = 0; i < MUESTRAS; i++) {
    const t = (i / (MUESTRAS - 1)) * (duracion - 0.05) + 0.02;
    await seekVideo(video, Math.min(t, Math.max(0, duracion - 0.05)));
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    let diff = 0;
    let brilloSum = 0;
    let count = 0;
    if (prev) {
      for (let p = 0; p < data.length; p += 4) {
        const d = Math.abs(data[p] - prev[p])
          + Math.abs(data[p + 1] - prev[p + 1])
          + Math.abs(data[p + 2] - prev[p + 2]);
        diff += d;
        brilloSum += (data[p] + data[p + 1] + data[p + 2]) / 3;
        count++;
      }
      diff /= count * 3; // 0..255 aprox, lo normalizamos abajo
    } else {
      for (let p = 0; p < data.length; p += 4) {
        brilloSum += (data[p] + data[p + 1] + data[p + 2]) / 3;
        count++;
      }
    }
    prev = new Uint8ClampedArray(data);

    // Brillo promedio 0..255
    const brillo = brilloSum / count;

    // Centro X: posición ponderada por brillo (asumimos mascota más clara que el fondo).
    let sumX = 0;
    let sumW = 0;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i4 = (y * canvas.width + x) * 4;
        const v = (data[i4] + data[i4 + 1] + data[i4 + 2]) / 3;
        sumX += x * v;
        sumW += v;
      }
    }
    const centroX = sumW > 0 ? sumX / sumW / canvas.width : 0.5;

    muestras.push({
      diff: Math.min(1, diff / 80), // normalizado aprox 0..1
      brillo,
      centroX,
    });
  }

  return { muestras, duracion, ancho: w, alto: h };
}

function seekVideo(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };
    video.addEventListener('seeked', onSeeked);
    try {
      video.currentTime = t;
    } catch {
      resolve();
    }
  });
}

// ---------- Audio ----------

async function medirAudio(
  blob: Blob,
  video: HTMLVideoElement,
): Promise<number> {
  // Decodifica el audio del blob y mide RMS.
  try {
    const Ctor = (window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    }).AudioContext ?? (window as unknown as {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext;
    if (!Ctor) return 0;
    const arrayBuffer = await blob.arrayBuffer();
    const ctx = new Ctor();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    let sumSq = 0;
    let n = 0;
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
      const data = audioBuffer.getChannelData(ch);
      for (let i = 0; i < data.length; i++) {
        sumSq += data[i] * data[i];
        n++;
      }
    }
    const rms = n > 0 ? Math.sqrt(sumSq / n) : 0;
    ctx.close().catch(() => {});
    // Si decodeAudioData tardó mucho y no había audio, retornamos silencio (0).
    return Math.min(1, rms * 4); // amplificar para que sea útil
  } catch {
    // No había pista de audio decodificable — silencio.
    return 0;
  } finally {
    // Silenciar para que no suene durante el muestreo
    video.muted = true;
  }
}

// ---------- API pública ----------

export interface ResultadoAnalisis {
  senales: Senales;
  clasificacion: Clasificacion;
  ancho: number;
  alto: number;
}

export async function analizarVideo(
  blob: Blob,
  especie: Especie,
): Promise<ResultadoAnalisis> {
  const url = URL.createObjectURL(blob);
  const video = document.createElement('video');
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('No se pudo cargar el video'));
  });

  // Si la duración no es finita (.webm de MediaRecorder), forzar lectura via seek.
  if (!isFinite(video.duration) || video.duration <= 0) {
    await new Promise<void>((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
      try {
        video.currentTime = 1e101;
      } catch {
        resolve();
      }
      // Timeout de seguridad
      setTimeout(() => resolve(), 1500);
    });
  }

  const { muestras, duracion, ancho, alto } = await muestrearVideo(video);
  const audio = await medirAudio(blob, video);

  URL.revokeObjectURL(url);

  // Agregar señales.
  const diffs = muestras.map((m) => m.diff);
  const movimiento = promedio(diffs);
  const rafagas = contarPicos(diffs, UMBRAL_RUPTURA);
  const brillos = muestras.map((m) => m.brillo);
  const brillo = promedio(brillos);
  const contraste = desvEstandar(brillos);
  const centros = muestras.map((m) => m.centroX);
  const zona = (promedio(centros) - 0.5) * 2; // -1 izquierda .. +1 derecha

  const senales: Senales = {
    movimiento,
    rafagas,
    brillo,
    contraste,
    zona,
    audio,
    duracion,
  };

  return {
    senales,
    clasificacion: deductAnimo(senales, especie),
    ancho,
    alto,
  };
}

// Helpers estadísticas
function promedio(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function desvEstandar(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = promedio(xs);
  const v = promedio(xs.map((x) => (x - m) ** 2));
  return Math.sqrt(v);
}

function contarPicos(xs: number[], umbral: number): number {
  let picos = 0;
  for (let i = 1; i < xs.length - 1; i++) {
    if (xs[i] > umbral && xs[i] >= xs[i - 1] && xs[i] >= xs[i + 1]) picos++;
  }
  return picos;
}

// ---------- Clasificación por especie ----------

/**
 * Tablas de decisión: cada combinación principal de señales -> un ánimo.
 * Determinista (mismas señales -> mismo ánimo) y sin IA.
 * Las "certezas" son honestas: con señales débiles o ambiguas, certeza baja.
 */
function clasificar(s: Senales): Clasificacion {
  const energia = (s.movimiento + Math.min(1, s.rafagas / 5) * 0.5) / 1.5;
  // Combinaciones principales: bajo / medio / alto movimiento × bajo / alto audio.
  // Para E6.5: si TODO es casi cero (movimiento < 0.04 y audio < 0.02) -> lecturaPobre.

  if (s.movimiento < 0.04 && s.audio < 0.02 && s.contraste < 6) {
    return { animo: 'zen', certeza: 18, lecturaPobre: true };
  }

  // Perro: 6 ánimos.
  // Gato: 6 ánimos. Las funciones devuelven el ánimo de la especie pasada.
  // Aquí devolvemos el "ánimo canónico" de un animal genérico y lo mapamos por especie abajo.
  const canon = clasificarCanon(s, energia);

  // Lectura pobre: si las señales son tibias (movimiento bajo/medio pero nada concluyente)
  // y el audio es nulo, bajamos certeza pero no marcamos lecturaPobre (la pista de audio es
  // a menudo inexistente).
  let certeza = 75;
  if (s.movimiento < 0.08 && s.audio < 0.03) certeza = 40;
  if (s.movimiento < 0.04 || s.rafagas === 0) certeza -= 15;

  return { animo: canon, certeza: Math.max(15, Math.min(95, certeza)), lecturaPobre: false };
}

function clasificarCanon(s: Senales, energia: number): Animo {
  // 'canon' representa el ánimo combinando perro/gato en una sola decisión.
  // Devolvemos uno del perro; la función pública lo mapea por especie.
  if (energia > 0.85 && s.audio > 0.08) return 'eufórico'; // perro eufórico / gato caceria
  if (energia > 0.6 && s.rafagas >= 3) return 'jugueton'; // perro jugueton / gato caceria
  if (energia > 0.4 && s.rafagas <= 2) return 'alerta'; // perro alerta / gato evaluandote
  if (energia > 0.25 && s.contraste > 12) return 'curioso'; // perro curioso / gato conversador
  if (s.audio > 0.06 && energia < 0.3) return 'quejandose'; // perro quejandose / gato reclamando
  return 'zen'; // perro zen / gato zen-absoluto / gato exigiendo (baja energía, luz baja)
}

// Mapea el ánimo canónico al ánimo real por especie.
// (Para gatos: 'eufórico' -> 'caceria', 'zen' -> 'zen-absoluto', etc.)
export function mapearAnimo(canon: Animo, especie: Especie): Animo {
  if (especie === 'perro') return canon as AnimoPerro;
  const mapa: Record<AnimoPerro, AnimoGato> = {
    eufórico: 'caceria',
    jugueton: 'caceria',
    alerta: 'evaluandote',
    curioso: 'conversador',
    quejandose: 'reclamando',
    zen: 'zen-absoluto',
  };
  return mapa[canon as AnimoPerro] ?? 'zen-absoluto';
}

/** Atajo: dado señales y especie, devuelve clasificación completa. */
export function deductAnimo(s: Senales, especie: Especie): Clasificacion {
  const c = clasificar(s);
  return { ...c, animo: mapearAnimo(c.animo, especie) };
}

// ---------- Miniaturas ----------

export async function generarMiniatura(
  blob: Blob,
  maxBytes = 40 * 1024,
): Promise<Blob | null> {
  try {
    const url = URL.createObjectURL(blob);
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('mini: no se pudo cargar'));
    });
    await seekVideo(video, Math.min(0.5, (video.duration || 1) / 2));
    const w = 240;
    const h = Math.round((video.videoHeight / video.videoWidth) * w) || 180;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctxOrNull = canvas.getContext('2d');
    if (!ctxOrNull) return null;
    const ctx: CanvasRenderingContext2D = ctxOrNull;
    ctx.drawImage(video, 0, 0, w, h);
    URL.revokeObjectURL(url);
    // Probar calidades hasta caber en maxBytes.
    let calidad = 0.7;
    let blobRes: Blob | null = null;
    for (let i = 0; i < 5; i++) {
      blobRes = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', calidad),
      );
      if (!blobRes) return null;
      if (blobRes.size <= maxBytes) break;
      calidad -= 0.12;
    }
    return blobRes;
  } catch {
    return null;
  }
}
