'use client';

// Tarjeta individual del historial (E5): miniatura, especie + ánimo + emoji,
// personaje, fecha relativa, indicador de video disponible, botón borrar.

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { RegistroTraduccion } from '../../../src/lib/tipos';
import { emojiAnimo } from '../../../src/lib/personajes';
import { fmtTiempoRelativo } from '../../components/VideoContext';

export interface HistoryCardProps {
  registro: RegistroTraduccion;
  onBorrar: (id: string) => void;
}

function nombreAnimo(a: string): string {
  return a.replace(/-/g, ' ');
}

function nombrePersonaje(p: string): string {
  const mapa: Record<string, string> = {
    narrador: 'Narrador solemne',
    telenovela: 'Telenovela',
    abuela: 'Abuela',
    coach: 'Coach',
    sarcastico: 'Sarcástico',
  };
  return mapa[p] ?? p;
}

export default function HistoryCard({ registro, onBorrar }: HistoryCardProps) {
  const [miniaturaUrl, setMiniaturaUrl] = useState<string | null>(null);
  const fechaLarga = new Date(registro.creadoEn).toLocaleString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const idBorrar = `borrar-${registro.id}`;

  useEffect(() => {
    if (!registro.miniatura) {
      setMiniaturaUrl(null);
      return;
    }
    const url = URL.createObjectURL(registro.miniatura);
    setMiniaturaUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [registro.miniatura]);

  return (
    <article className="card stack" aria-labelledby={`fecha-${registro.id}`}>
      <Link
        href={`/historial/${registro.id}`}
        className="history-card"
        aria-label={`Abrir traducción del ${fechaLarga}`}
      >
        {miniaturaUrl ? (
          <img className="thumb" src={miniaturaUrl} alt={`Miniatura del ${fechaLarga}`} />
        ) : (
          <div className="thumb thumb-empty" aria-hidden="true">
            🎬
          </div>
        )}
        <strong>
          {registro.especie === 'perro' ? '🐶' : '🐱'} {registro.especie} ·{' '}
          {emojiAnimo(registro.animo)} {nombreAnimo(registro.animo)}
        </strong>
        <span className="muted text-sm">Voz de: {nombrePersonaje(registro.personaje)}</span>
        <span id={`fecha-${registro.id}`} className="muted text-sm">
          {fmtTiempoRelativo(registro.creadoEn)}
        </span>
        <div>
          {registro.videoBlob ? (
            <span className="badge badge-ok">Con video</span>
          ) : (
            <span className="badge">Solo imagen</span>
          )}
          {registro.lecturaPobre && (
            <span className="badge badge-warn" style={{ marginLeft: 6 }}>
              Lectura pobre
            </span>
          )}
        </div>
      </Link>
      <div className="cluster" style={{ justifyContent: 'flex-end' }}>
        <button
          id={idBorrar}
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={(e) => {
            e.preventDefault();
            if (window.confirm('¿Borrar esta traducción? No se puede deshacer.')) {
              onBorrar(registro.id);
            }
          }}
          aria-label={`Borrar traducción del ${fechaLarga}`}
        >
          Borrar
        </button>
      </div>
    </article>
  );
}