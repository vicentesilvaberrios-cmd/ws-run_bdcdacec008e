'use client';

// Detalle de una traducción (E5.1): video (si hay blob), diálogo, ánimo, certeza,
// señales, personaje; permite reescribir el diálogo con otro personaje y borrar.

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PersonajeSelector from '../../components/PersonajeSelector';
import { obtenerTraduccion, borrarTraduccion, guardarTraduccion } from '../../../src/lib/db';
import type { Personaje, Pista, RegistroTraduccion } from '../../../src/lib/tipos';
import { emojiAnimo, reescribirDialogo } from '../../../src/lib/personajes';
import { burnSubtitles } from '../../../src/lib/subtitulos';

function fmt(s: number): string {
  return `${s.toFixed(1)}s`;
}

export default function DetalleTraduccion({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [registro, setRegistro] = useState<RegistroTraduccion | null>(null);
  const [dialogo, setDialogo] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const r = await obtenerTraduccion(params.id);
      if (!r) {
        setError('No encontramos esta traducción. Quizás ya fue borrada.');
      } else {
        setRegistro(r);
        setDialogo(r.dialogo);
      }
    } catch {
      setError('No pudimos leer esta traducción.');
    } finally {
      setCargando(false);
    }
  }, [params.id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!registro?.videoBlob) {
      setVideoUrl(null);
      return;
    }
    const url = URL.createObjectURL(registro.videoBlob);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [registro?.videoBlob]);

  function cambiarPersonaje(p: Personaje) {
    if (!registro) return;
    const nuevoDialogo = reescribirDialogo(dialogo, p);
    setDialogo(nuevoDialogo);
    const actualizado: RegistroTraduccion = { ...registro, personaje: p, dialogo: nuevoDialogo };
    setRegistro(actualizado);
    guardarTraduccion(actualizado).catch(() => {
      setError('No pudimos guardar el nuevo personaje.');
    });
  }

  async function borrar() {
    if (!registro) return;
    if (!window.confirm('¿Borrar esta traducción? No se puede deshacer.')) return;
    try {
      await borrarTraduccion(registro.id);
      router.replace('/historial');
    } catch {
      setError('No pudimos borrar. Inténtalo otra vez.');
    }
  }

  async function guardarVideo() {
    if (!registro || !registro.videoBlob) return;
    setFeedback('Preparando video con subtítulos…');
    try {
      const blob = await burnSubtitles(registro.videoBlob, {
        dialogo,
        duracion: registro.duracion,
        ancho: registro.ancho,
        alto: registro.alto,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `traduccion-${registro.id}.webm`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setFeedback('Video guardado en tu carpeta de descargas');
    } catch {
      setError('No pudimos guardar el video.');
      setFeedback(null);
    } finally {
      window.setTimeout(() => setFeedback(null), 3000);
    }
  }

  if (cargando) {
    return <div className="muted">Cargando traducción…</div>;
  }
  if (error) {
    return (
      <div className="stack">
        <div className="alert alert-error" role="alert">
          {error}
        </div>
        <Link href="/historial" className="btn btn-ghost">
          Volver al historial
        </Link>
      </div>
    );
  }
  if (!registro) return null;

  const fechaLarga = new Date(registro.creadoEn).toLocaleString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="stack">
      <header>
        <h1>Traducción del {fechaLarga}</h1>
        <p className="subtitle">
          {emojiAnimo(registro.animo)} {humanoAnimo(registro.animo)} · certeza {registro.certeza}%
        </p>
      </header>

      {feedback && (
        <div className="badge badge-ok" role="status" aria-live="polite">
          {feedback}
        </div>
      )}

      {videoUrl ? (
        <video
          src={videoUrl}
          controls
          autoPlay
          loop
          muted
          playsInline
          style={{ width: '100%', borderRadius: 'var(--radius)', background: '#000' }}
          aria-label="Video original"
        />
      ) : (
        <div className="alert alert-info">
          Este video ya no está disponible (solo guardamos los últimos 10 con video).
        </div>
      )}

      <div className="card stack">
        <strong>Diálogo</strong>
        {dialogo.map((l, i) => (
          <p key={i} style={{ fontSize: 'var(--fs-lg)', fontWeight: 600 }}>
            {l}
          </p>
        ))}
        <div className="cluster">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(dialogo.join('\n'));
                setFeedback('Diálogo copiado');
                window.setTimeout(() => setFeedback(null), 3000);
              } catch {
                setError('No pudimos copiar el diálogo.');
              }
            }}
          >
            📋 Copiar diálogo
          </button>
          {registro.videoBlob && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={guardarVideo}>
              🎬 Guardar video
            </button>
          )}
        </div>
      </div>

      <div className="card stack">
        <h2 className="title" style={{ fontSize: 'var(--fs-xl)' }}>
          Cambia la voz
        </h2>
        <PersonajeSelector value={registro.personaje} onChange={cambiarPersonaje} />
      </div>

      <div className="card stack">
        <strong>Cómo se midió</strong>
        <ul className="steps" style={{ margin: 0 }}>
          <li>Especie: <strong>{registro.especie}</strong></li>
          <li>Movimiento: {(registro.senales.movimiento * 100).toFixed(0)}%</li>
          <li>Ráfagas: {registro.senales.rafagas}</li>
          <li>Brillo: {Math.round(registro.senales.brillo)} / 255</li>
          <li>Audio: {(registro.senales.audio * 100).toFixed(0)}%</li>
          <li>Duración: {fmt(registro.duracion)}</li>
          <li>
            Ánimo: <strong>{humanoAnimo(registro.animo)}</strong> {emojiAnimo(registro.animo)}
          </li>
          {registro.pista && <li>Pista: <strong>{humanoPista(registro.pista)}</strong></li>}
          {registro.lecturaPobre && <li>Lectura pobre: las señales estaban muy débiles.</li>}
        </ul>
      </div>

      <div className="cluster">
        <Link href="/historial" className="btn btn-ghost">
          ← Volver al historial
        </Link>
        <button type="button" className="btn btn-danger" onClick={borrar}>
          Borrar esta traducción
        </button>
      </div>
    </div>
  );
}

function humanoAnimo(a: string): string {
  const mapa: Record<string, string> = {
    'eufórico': 'eufórico',
    'jugueton': 'juguetón',
    'alerta': 'alerta',
    'curioso': 'curioso',
    'quejandose': 'quejándose',
    'zen': 'zen',
    'exigiendo': 'exigiendo',
    'caceria': 'de caza',
    'conversador': 'conversador',
    'evaluandote': 'evaluándote',
    'reclamando': 'reclamando',
    'zen-absoluto': 'zen absoluto',
  };
  return mapa[a] ?? a;
}

function humanoPista(p: NonNullable<Pista>): string {
  const mapa: Record<NonNullable<Pista>, string> = {
    mirando: 'me mira fijo',
    corriendo: 'corre como loco',
    puerta: 'está en la puerta',
    plato: 'cerca de su plato',
    retado: 'lo acaban de retar',
    despierto: 'recién despertó',
  };
  return mapa[p];
}