'use client';

// Previsualización en loop mudo (E1.7) con controles de quitar/reemplazar.

import { useEffect, useRef } from 'react';

export interface VideoPreviewProps {
  src: string;
  nombreArchivo?: string;
  onQuitar?: () => void;
}

export default function VideoPreview({ src, nombreArchivo, onQuitar }: VideoPreviewProps) {
  const ref = useRef<HTMLVideoElement | null>(null);

  // El video se monta de nuevo si cambia el src (tras reemplazar).
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {
      /* autoplay puede fallar en algunos navegadores; no es crítico */
    });
  }, [src]);

  return (
    <div className="card stack" aria-label="Vista previa del video">
      <div className="cluster justify-between">
        <strong>Tu video</strong>
        {nombreArchivo && <span className="muted text-sm">{nombreArchivo}</span>}
      </div>
      <video
        ref={ref}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        controls
        style={{ width: '100%', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)' }}
        aria-label="Vista previa del video en loop"
      />
      {onQuitar && (
        <div className="cluster">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onQuitar}>
            Quitar video
          </button>
          <span className="muted text-sm">Se repite en silencio. Puedes reemplazarlo arrastrando otro.</span>
        </div>
      )}
    </div>
  );
}