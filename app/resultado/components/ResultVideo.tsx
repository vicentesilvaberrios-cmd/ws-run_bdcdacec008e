'use client';

// Reproductor video en loop con subtítulos superpuestos sincronizados por duración (E4.2).

import { useEffect, useRef, useState } from 'react';

export interface ResultVideoProps {
  src: string;
  /** Líneas del diálogo. Se distribuyen uniformemente sobre la duración. */
  dialogo: string[];
  /** Duración total del video en segundos. */
  duracion: number;
  /** Si el usuario no quiere subtítulos superpuestos, los oculta. */
  mostrarSubtitulos?: boolean;
}

function calcularIntervalos(n: number, dur: number): { inicio: number; fin: number }[] {
  if (n <= 0 || dur <= 0) return [];
  const paso = dur / n;
  const out: { inicio: number; fin: number }[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      inicio: i * paso,
      fin: i === n - 1 ? dur : (i + 1) * paso,
    });
  }
  return out;
}

export default function ResultVideo({
  src,
  dialogo,
  duracion,
  mostrarSubtitulos = true,
}: ResultVideoProps) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [lineaIdx, setLineaIdx] = useState(0);
  const intervalos = calcularIntervalos(dialogo.length, duracion);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  }, [src]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    function onTime() {
      if (!v) return;
      const t = v.currentTime;
      const idx = intervalos.findIndex((iv) => t >= iv.inicio && t < iv.fin);
      if (idx >= 0 && idx !== lineaIdx) setLineaIdx(idx);
    }
    v.addEventListener('timeupdate', onTime);
    return () => v.removeEventListener('timeupdate', onTime);
  }, [intervalos, lineaIdx]);

  const subtituloActual = mostrarSubtitulos && intervalos.length > 0 ? dialogo[lineaIdx] : null;

  return (
    <div
      className="card"
      style={{
        position: 'relative',
        padding: 0,
        overflow: 'hidden',
        background: '#000',
      }}
    >
      <video
        ref={ref}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        controls
        style={{ width: '100%', display: 'block', background: '#000' }}
        aria-label="Video doblado en loop"
      />
      {subtituloActual && (
        <div className="captions" role="status" aria-live="off">
          {subtituloActual}
        </div>
      )}
    </div>
  );
}