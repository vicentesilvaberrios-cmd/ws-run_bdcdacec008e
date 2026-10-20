// Quemado de subtítulos sobre un video (E4.6).
// Reproduce el video original en un <canvas>, dibuja los subtítulos abajo como texto con
// fondo, captura ese canvas con MediaRecorder y devuelve un Blob .webm reproducible.
//
// Estrategia:
//  1) Crear <video> oculto + <canvas> con las dimensiones pedidas.
//  2) Crear un stream del canvas; el video.original alimenta requestVideoFrameCallback
//     para sincronizar cada cuadro.
//  3) Para cada línea del diálogo, calcular su intervalo dentro del video
//     (distribuyendo en partes iguales).
//  4) Iniciar MediaRecorder, reproducir el video, dibujar el frame actual + subtítulo
//     si el tiempo cae dentro del intervalo.
//  5) Al terminar, devolver el Blob .webm.

export interface BurnSubtitlesOpts {
  /** Líneas del diálogo (se distribuyen uniformemente en la duración). */
  dialogo: string[];
  /** Duración objetivo en segundos (debe coincidir con la del video). */
  duracion: number;
  /** Ancho del video de salida. */
  ancho: number;
  /** Alto del video de salida. */
  alto: number;
}

export async function burnSubtitles(
  videoBlob: Blob,
  opts: BurnSubtitlesOpts,
): Promise<Blob> {
  const { dialogo, duracion, ancho, alto } = opts;
  const url = URL.createObjectURL(videoBlob);

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

  const canvas = document.createElement('canvas');
  canvas.width = ancho || video.videoWidth || 320;
  canvas.height = alto || video.videoHeight || 240;
  const ctxOrNull = canvas.getContext('2d');
  if (!ctxOrNull) throw new Error('Canvas no disponible');
  const ctx: CanvasRenderingContext2D = ctxOrNull;

  // Stream del canvas a 30fps
  const stream = canvas.captureStream(30);
  const mime = 'video/webm;codecs=vp8';
  const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(mime)
    ? { mimeType: mime, videoBitsPerSecond: 600_000 }
    : undefined);

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const terminado = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(blob);
    };
  });

  // Calcular intervalos para cada línea (3-4 líneas; algunas pueden quedar en el último
  // segmento más largo para que se lea la "remate").
  const intervalos = calcularIntervalos(dialogo.length, duracion);

  // Función de dibujo: pinta el frame actual del video y, si el tiempo cae dentro de un
  // intervalo, pinta el subtítulo correspondiente.
  let frameActual = 0;
  function pintarFrame() {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const t = video.currentTime;
    const idx = intervalos.findIndex((iv) => t >= iv.inicio && t < iv.fin);
    if (idx >= 0) {
      const linea = dialogo[idx];
      dibujarSubtitulo(ctx, linea, canvas.width, canvas.height);
    }
    frameActual++;
  }

  // Bucle principal
  recorder.start();
  video.currentTime = 0;
  await video.play();

  // Pintar en cada requestAnimationFrame (el video entrega los cuadros nativos al canvas).
  await new Promise<void>((resolve) => {
    function tick() {
      if (video.ended || video.currentTime >= duracion - 0.05) {
        resolve();
        return;
      }
      pintarFrame();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  // Pintar un último cuadro con el último subtítulo (por si el último intervalo coincide
  // con el final exacto).
  pintarFrame();
  await new Promise((r) => setTimeout(r, 80));

  recorder.stop();
  stream.getTracks().forEach((t) => t.stop());
  video.pause();
  URL.revokeObjectURL(url);

  return terminado;
}

function calcularIntervalos(cantidad: number, duracion: number): { inicio: number; fin: number }[] {
  if (cantidad <= 0) return [];
  const out: { inicio: number; fin: number }[] = [];
  const paso = duracion / cantidad;
  for (let i = 0; i < cantidad; i++) {
    out.push({
      inicio: i * paso,
      fin: i === cantidad - 1 ? duracion : (i + 1) * paso,
    });
  }
  return out;
}

function dibujarSubtitulo(
  ctx: CanvasRenderingContext2D,
  texto: string,
  ancho: number,
  alto: number,
): void {
  ctx.save();
  ctx.font = 'bold 22px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const paddingX = 16;
  const paddingY = 12;
  const lineas = wrapTexto(ctx, texto, ancho - paddingX * 2);
  const bloqueAlto = lineas.length * 28 + paddingY * 2;
  const yBloque = alto - bloqueAlto - 14;

  // Fondo semitransparente
  ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
  ctx.fillRect(0, yBloque, ancho, bloqueAlto);

  // Texto
  ctx.fillStyle = '#fff';
  let y = yBloque + paddingY + 22;
  for (const linea of lineas) {
    ctx.fillText(linea, ancho / 2, y);
    y += 28;
  }
  ctx.restore();
}

function wrapTexto(ctx: CanvasRenderingContext2D, texto: string, maxWidth: number): string[] {
  const palabras = texto.split(/\s+/);
  const lineas: string[] = [];
  let actual = '';
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (ctx.measureText(prueba).width <= maxWidth) {
      actual = prueba;
    } else {
      if (actual) lineas.push(actual);
      actual = p;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}
