'use client';

// Zona de arrastre/soltar (E1.2, E1.3).
// Acepta video/* por MIME o por extensión (.mp4, .webm, .mov, .m4v).
// Valida duración 2–60 s. Si la duración es NaN/Infinity (común en .webm de MediaRecorder),
// fuerza la lectura via currentTime=1e101 (E1.3).

import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from 'react';

const EXTENSIONES_VALIDAS = ['mp4', 'webm', 'mov', 'm4v'];
const DUR_MIN = 2;
const DUR_MAX = 60;
const MAX_BYTES = 50 * 1024 * 1024; // 50MB: suficiente para clips cortos.

export interface ValidacionError {
  mensaje: string;
}

export interface ValidacionOk {
  ok: true;
  file: File;
  duracion: number;
  ancho: number;
  alto: number;
}

/** Lee la duración del video; si no es finita, fuerza la lectura via seek (E1.3). */
function leerDuracion(video: HTMLVideoElement): Promise<{ duracion: number; ancho: number; alto: number }> {
  return new Promise((resolve) => {
    const w = video.videoWidth || 320;
    const h = video.videoHeight || 240;
    let d = video.duration;
    if (Number.isFinite(d) && d > 0) {
      resolve({ duracion: d, ancho: w, alto: h });
      return;
    }
    // Duración no finita: truco de seek a 1e101.
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      const d2 = video.duration;
      resolve({
        duracion: Number.isFinite(d2) && d2 > 0 ? d2 : DUR_MIN, // fallback razonable
        ancho: video.videoWidth || w,
        alto: video.videoHeight || h,
      });
    };
    video.addEventListener('seeked', onSeeked);
    try {
      video.currentTime = 1e101;
    } catch {
      onSeeked();
    }
    // Timeout de seguridad
    setTimeout(() => {
      video.removeEventListener('seeked', onSeeked);
      resolve({
        duracion: Number.isFinite(video.duration) && video.duration > 0 ? video.duration : DUR_MIN,
        ancho: video.videoWidth || w,
        alto: video.videoHeight || h,
      });
    }, 1500);
  });
}

export async function validarVideo(file: File): Promise<ValidacionOk | ValidacionError> {
  // 1) Validación de tipo/extensión
  const tipo = file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const tipoEsVideo = tipo.startsWith('video/');
  const extEsVideo = EXTENSIONES_VALIDAS.includes(ext);
  if (!tipoEsVideo && !extEsVideo) {
    return { mensaje: 'Ese archivo no es un video. Elige un .mp4, .webm, .mov o .m4v.' };
  }
  if (file.size > MAX_BYTES) {
    return { mensaje: 'El video es muy pesado (más de 50 MB). Elige uno más liviano.' };
  }

  // 2) Validación de duración
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.muted = true;
  video.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      const ok = () => {
        video.removeEventListener('loadedmetadata', ok);
        video.removeEventListener('error', err);
        resolve();
      };
      const err = () => {
        video.removeEventListener('loadedmetadata', ok);
        video.removeEventListener('error', err);
        reject(new Error('load'));
      };
      video.addEventListener('loadedmetadata', ok);
      video.addEventListener('error', err);
    });
    const { duracion, ancho, alto } = await leerDuracion(video);
    if (duracion < DUR_MIN) {
      URL.revokeObjectURL(url);
      return { mensaje: 'El video dura menos de 2 segundos. Graba un poquito más.' };
    }
    if (duracion > DUR_MAX) {
      URL.revokeObjectURL(url);
      return { mensaje: 'El video dura más de 60 segundos. Recorta un fragmento.' };
    }
    URL.revokeObjectURL(url);
    return { ok: true, file, duracion, ancho, alto };
  } catch {
    URL.revokeObjectURL(url);
    return { mensaje: 'No pudimos leer ese video. Prueba con otro archivo.' };
  }
}

export interface DropZoneProps {
  onArchivo: (file: File, meta: { duracion: number; ancho: number; alto: number }) => void;
  onError?: (mensaje: string) => void;
  deshabilitado?: boolean;
}

export default function DropZone({ onArchivo, onError, deshabilitado }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [cargando, setCargando] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const procesar = useCallback(
    async (file: File) => {
      setCargando(true);
      const r = await validarVideo(file);
      setCargando(false);
      if ('ok' in r) {
        onArchivo(r.file, { duracion: r.duracion, ancho: r.ancho, alto: r.alto });
      } else {
        onError?.(r.mensaje);
      }
    },
    [onArchivo, onError],
  );

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (deshabilitado) return;
    const f = e.dataTransfer.files?.[0];
    if (f) void procesar(f);
  }
  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!dragOver) setDragOver(true);
  }
  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
  }
  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) void procesar(f);
    // Permite re-seleccionar el mismo archivo después
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div
      className={`dropzone${dragOver ? ' is-dragover' : ''}`}
      onClick={() => !deshabilitado && inputRef.current?.click()}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      role="button"
      tabIndex={0}
      aria-label="Arrastra un video o haz clic para elegir uno"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*,.mp4,.webm,.mov,.m4v"
        onChange={onPick}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
      {cargando ? (
        <>
          <div className="headline">Comprobando el video…</div>
          <div className="sub">Verificando duración y formato</div>
        </>
      ) : dragOver ? (
        <>
          <div className="headline">Suelta para empezar</div>
          <div className="sub">Suelta aquí tu video</div>
        </>
      ) : (
        <>
          <div className="headline">Arrastra aquí tu video</div>
          <div className="sub">o haz clic para elegirlo</div>
          <div className="sub muted text-sm">Mínimo 2 s, máximo 60 s</div>
        </>
      )}
    </div>
  );
}