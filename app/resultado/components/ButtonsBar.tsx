'use client';

// Barra de acciones del resultado (E4.5–E4.10):
// - Guardar video (.webm con subtítulos quemados) → primaria
// - Guardar imagen (PNG)
// - Copiar diálogo
// - Que lo diga (voz local)
// - Otro guion (atajo R)
// - Traducir otro video (atajo N)

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVideo } from '../../components/VideoContext';
import { burnSubtitles } from '../../../src/lib/subtitulos';
import { speakLine, stopSpeaking, getVozDisponible } from '../../../src/lib/voz';

export interface ButtonsBarProps {
  /** Si se debe exponer "Otro guion" (R). */
  onOtroGuion?: () => void;
}

function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export default function ButtonsBar({ onOtroGuion }: ButtonsBarProps) {
  const router = useRouter();
  const { video, videoBlob, dialogo, resultado, reset } = useVideo();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTipo, setFeedbackTipo] = useState<'ok' | 'info' | 'error'>('ok');
  const [guardando, setGuardando] = useState<'video' | 'imagen' | null>(null);

  function flash(msg: string, tipo: 'ok' | 'info' | 'error' = 'ok') {
    setFeedback(msg);
    setFeedbackTipo(tipo);
    window.setTimeout(() => setFeedback(null), 3000);
  }

  async function guardarVideo() {
    if (!videoBlob || !video || !resultado) return;
    setGuardando('video');
    try {
      const quemado = await burnSubtitles(videoBlob, {
        dialogo,
        duracion: resultado.senales.duracion,
        ancho: video.ancho || resultado.ancho,
        alto: video.alto || resultado.alto,
      });
      descargarBlob(
        quemado,
        `traduccion-${Date.now()}.webm`,
      );
      flash('Video guardado en tu carpeta de descargas');
    } catch {
      flash('No pudimos guardar el video. Inténtalo otra vez.', 'error');
    } finally {
      setGuardando(null);
    }
  }

  async function guardarImagen() {
    if (!videoBlob || !resultado) return;
    setGuardando('imagen');
    try {
      // Capturar un frame central + diálogo encima
      const url = URL.createObjectURL(videoBlob);
      const v = document.createElement('video');
      v.src = url;
      v.muted = true;
      v.playsInline = true;
      v.preload = 'auto';
      await new Promise<void>((resolve, reject) => {
        v.onloadedmetadata = () => resolve();
        v.onerror = () => reject(new Error('load'));
      });
      await new Promise<void>((resolve) => {
        const handler = () => {
          v.removeEventListener('seeked', handler);
          resolve();
        };
        v.addEventListener('seeked', handler);
        v.currentTime = Math.min(0.5, (v.duration || 1) / 2);
      });
      const w = 720;
      const h = Math.round((v.videoHeight / v.videoWidth) * w) || 540;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h + 160; // espacio para el diálogo
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');
      ctx.fillStyle = '#0f1318';
      ctx.fillRect(0, 0, w, h + 160);
      ctx.drawImage(v, 0, 0, w, h);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      const padding = 18;
      let y = h + 38;
      for (const linea of dialogo) {
        const lineas = wrap(ctx, linea, w - padding * 2);
        for (const l of lineas) {
          ctx.fillText(l, padding, y);
          y += 28;
        }
      }
      URL.revokeObjectURL(url);

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png'),
      );
      if (!blob) throw new Error('png');
      descargarBlob(blob, `traduccion-${Date.now()}.png`);
      flash('Imagen guardada en tu carpeta de descargas');
    } catch {
      flash('No pudimos guardar la imagen. Inténtalo otra vez.', 'error');
    } finally {
      setGuardando(null);
    }
  }

  async function copiarDialogo() {
    try {
      await navigator.clipboard.writeText(dialogo.join('\n'));
      flash('Diálogo copiado al portapapeles');
    } catch {
      // Fallback: usar un textarea temporal
      const ta = document.createElement('textarea');
      ta.value = dialogo.join('\n');
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        flash('Diálogo copiado al portapapeles');
      } catch {
        flash('No pudimos copiar. Selecciónalo manualmente.', 'error');
      }
      ta.remove();
    }
  }

  function queLoDiga() {
    const voces = getVozDisponible();
    if (voces.length === 0) {
      flash(
        'No hay voz en español disponible en este navegador. La instalación depende del sistema.',
        'info',
      );
      return;
    }
    // Lee cada línea pausada para que se escuche como diálogo
    let i = 0;
    function next() {
      if (i >= dialogo.length) return;
      const texto = dialogo[i++];
      speakLine(texto);
      // Esperar aprox: 0.7s por palabra
      const esperar = Math.max(1500, texto.split(/\s+/).length * 350);
      window.setTimeout(next, esperar);
    }
    next();
  }

  function traducirOtro() {
    stopSpeaking();
    reset();
    router.push('/');
  }

  function otroGuion() {
    stopSpeaking();
    onOtroGuion?.();
  }

  return (
    <div className="cluster" role="toolbar" aria-label="Acciones del resultado">
      <button
        type="button"
        className="btn btn-primary"
        onClick={guardarVideo}
        disabled={guardando === 'video'}
      >
        {guardando === 'video' ? <span className="spinner-mini" /> : '🎬'} Guardar video
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={guardarImagen}
        disabled={guardando === 'imagen'}
      >
        {guardando === 'imagen' ? <span className="spinner-mini" /> : '🖼️'} Guardar imagen
      </button>
      <button type="button" className="btn btn-ghost" onClick={copiarDialogo}>
        📋 Copiar diálogo
        <span
          className="help-tip"
          data-tip="Copia el texto al portapapeles para pegarlo donde quieras."
          tabIndex={0}
          role="note"
          aria-label="Copia el texto al portapapeles para pegarlo donde quieras."
        >
          ?
        </span>
      </button>
      <button type="button" className="btn btn-ghost" onClick={queLoDiga}>
        🔊 Que lo diga
        <span
          className="help-tip"
          data-tip="Reproduce el diálogo con la voz de tu navegador. Si no suena, prueba instalar una voz en español."
          tabIndex={0}
          role="note"
          aria-label="Reproduce el diálogo con la voz de tu navegador."
        >
          ?
        </span>
      </button>
      <button type="button" className="btn btn-ghost" onClick={otroGuion} aria-keyshortcuts="R">
        ✍️ Otro guion
        <span
          className="help-tip"
          data-tip={`Mismo ánimo, otro guion. Atajo: R.`}
          tabIndex={0}
          role="note"
          aria-label="Mismo ánimo, otro guion. Atajo: R."
        >
          ?
        </span>
      </button>
      <button type="button" className="btn btn-ghost" onClick={traducirOtro} aria-keyshortcuts="N">
        ➕ Traducir otro video
        <span
          className="help-tip"
          data-tip="Vuelve a Inicio para elegir un video nuevo. Atajo: N."
          tabIndex={0}
          role="note"
          aria-label="Vuelve a Inicio para elegir un video nuevo. Atajo: N."
        >
          ?
        </span>
      </button>
      {feedback && (
        <span
          className={`badge ${feedbackTipo === 'ok' ? 'badge-ok' : feedbackTipo === 'info' ? 'badge-info' : 'badge-danger'}`}
          role="status"
          aria-live="polite"
        >
          {feedback}
        </span>
      )}
    </div>
  );
}

function wrap(ctx: CanvasRenderingContext2D, texto: string, maxWidth: number): string[] {
  const palabras = texto.split(/\s+/);
  const out: string[] = [];
  let act = '';
  for (const p of palabras) {
    const prueba = act ? `${act} ${p}` : p;
    if (ctx.measureText(prueba).width <= maxWidth) {
      act = prueba;
    } else {
      if (act) out.push(act);
      act = p;
    }
  }
  if (act) out.push(act);
  return out;
}