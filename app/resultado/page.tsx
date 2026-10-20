'use client';

// Pantalla resultado (E4): video con diálogo sincronizado, ánimo, certeza,
// "cómo llegué a esto", selector de personaje para reescribir, botones de acción.

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ResultVideo from './components/ResultVideo';
import DialogoDisplay from './components/DialogoDisplay';
import ButtonsBar from './components/ButtonsBar';
import PersonajeSelector from '../components/PersonajeSelector';
import { useVideo } from '../components/VideoContext';
import { emojiAnimo, reescribirDialogo } from '../../src/lib/personajes';
import type { Personaje, Pista } from '../../src/lib/tipos';
import { getDialogo } from '../../src/lib/dialogo';
import { guardarTraduccion } from '../../src/lib/db';

function fmt(s: number): string {
  return `${s.toFixed(1)}s`;
}

export default function Resultado() {
  const router = useRouter();
  const {
    video,
    videoBlob,
    especie,
    personaje,
    pista,
    resultado,
    dialogo,
    registroActual,
    setDialogo,
    setPersonaje,
    setRegistroActual,
  } = useVideo();
  const [mostrarDialogoCompleto, setMostrarDialogoCompleto] = useState(false);
  const [mostrarSenales, setMostrarSenales] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirige si no hay resultado / video
  useEffect(() => {
    if (!video || !resultado) {
      router.replace('/');
    }
  }, [video, resultado, router]);

  // Reaccionar al atajo R: regenera diálogo base (mismo ánimo, otro banco).
  useEffect(() => {
    function handler() {
      regenerar();
    }
    window.addEventListener('app:regenerarGuion', handler);
    return () => window.removeEventListener('app:regenerarGuion', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultado, personaje]);

  function regenerar() {
    if (!resultado) return;
    // La "otra versión" reescribe con el mismo personaje, pero forzando una pequeña
    // variación: usamos un id pseudo-aleatorio basado en Date.now para que getDialogo
    // elija otras plantillas. Para mantener determinismo en el detalle, no guardamos
    // esta versión: solo cambiamos el diálogo mostrado.
    // Truco simple: cambiamos temporalmente la pista null→'mirando'→null no funciona;
    // hacemos una segunda llamada a getDialogo con una pista falsa (no, perderíamos determinismo).
    // Estrategia simple: generar otra versión reescribiendo las mismas ideas-base con
    // aperturas/cierres distintos del personaje (ya cubierto por reescribirDialogo).
    // Para más variación, rotamos las líneas: barajamos el orden de manera estable.
    const base = getDialogo(especie, resultado.clasificacion.animo, personaje, pista, resultado.senales);
    const dialogoBarajado = barajarEstable(base, Date.now() & 0xff);
    const dialogoReescrito = reescribirDialogo(dialogoBarajado, personaje);
    setDialogo(dialogoReescrito);
  }

  function cambiarPersonaje(p: Personaje) {
    setPersonaje(p);
    if (!resultado) return;
    // Reescribe sin re-analizar (E4.4)
    const nuevoDialogo = reescribirDialogo(dialogo, p);
    setDialogo(nuevoDialogo);
    // Actualizar el registro persistido con el nuevo personaje + diálogo
    if (registroActual) {
      const actualizado = { ...registroActual, personaje: p, dialogo: nuevoDialogo };
      setRegistroActual(actualizado);
      guardarTraduccion(actualizado).catch(() => {
        setError('No pudimos guardar el nuevo personaje. Inténtalo otra vez.');
      });
    }
  }

  const certezaChiste = useMemo(() => {
    if (!resultado) return '';
    if (resultado.clasificacion.lecturaPobre) {
      return 'No pudimos leer mucho (las señales estaban muy quietas). Mejor no inventar nada.';
    }
    const c = resultado.clasificacion.certeza;
    if (c >= 70) return '¡Buena señal! Tu mascota está clarísima.';
    if (c >= 50) return 'Más o menos. El doblaje es parte arte, parte ciencia.';
    return 'Un poco a ciegas. Pero igual nos reímos.';
  }, [resultado]);

  if (!video || !resultado) return null;

  return (
    <div className="stack">
      <header>
        <h1>Tu doblaje</h1>
        <p className="subtitle">
          {emojiAnimo(resultado.clasificacion.animo)} {humanoAnimo(resultado.clasificacion.animo)} ·{' '}
          <span className="muted">certeza {resultado.clasificacion.certeza}%</span>
        </p>
      </header>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <ResultVideo
        src={video.blobUrl}
        dialogo={dialogo}
        duracion={resultado.senales.duracion}
      />

      <div className="cluster">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setMostrarDialogoCompleto((v) => !v)}
          aria-expanded={mostrarDialogoCompleto}
        >
          {mostrarDialogoCompleto ? 'Ocultar transcripción completa' : 'Mostrar transcripción completa'}
        </button>
      </div>

      <DialogoDisplay
        dialogo={dialogo}
        duracion={resultado.senales.duracion}
        mostrarCompleto={mostrarDialogoCompleto}
      />

      <section className="card stack" aria-labelledby="como-llegue">
        <h2 id="como-llegue" className="title" style={{ fontSize: 'var(--fs-xl)' }}>
          Cómo llegué a esto
        </h2>
        <p className="muted">{certezaChiste}</p>
        <ul className="steps" style={{ margin: 0 }}>
          <li>
            Especie elegida: <strong>{especie}</strong>.
          </li>
          <li>
            Movimiento detectado: <strong>{Math.round(resultado.senales.movimiento * 100)}%</strong> ·{' '}
            <strong>{resultado.senales.rafagas}</strong> {resultado.senales.rafagas === 1 ? 'ráfaga' : 'ráfagas'} ·{' '}
            brillo promedio <strong>{Math.round(resultado.senales.brillo)}</strong>.
          </li>
          <li>
            Audio medido al <strong>{Math.round(resultado.senales.audio * 100)}%</strong> de energía.
          </li>
          <li>
            Duración del clip: <strong>{fmt(resultado.senales.duracion)}</strong>.
            {pista && (
              <>
                {' '}Pista: <strong>{etiquetaPista(pista)}</strong>.
              </>
            )}
          </li>
          <li>
            Ánimo final: <strong>{humanoAnimo(resultado.clasificacion.animo)}</strong>{' '}
            {emojiAnimo(resultado.clasificacion.animo)}.
          </li>
        </ul>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setMostrarSenales((v) => !v)}
          aria-expanded={mostrarSenales}
        >
          {mostrarSenales ? 'Ocultar señales crudas' : 'Ver todas las señales medidas'}
        </button>
        {mostrarSenales && (
          <div className="panel text-sm" aria-label="Señales medidas">
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li>Movimiento: {(resultado.senales.movimiento * 100).toFixed(1)}%</li>
              <li>Ráfagas: {resultado.senales.rafagas}</li>
              <li>Brillo: {resultado.senales.brillo.toFixed(1)} / 255</li>
              <li>Contraste (var. brillo): {resultado.senales.contraste.toFixed(1)}</li>
              <li>Zona (centro X): {resultado.senales.zona.toFixed(2)} (-1 izquierda · +1 derecha)</li>
              <li>Audio (RMS): {(resultado.senales.audio * 100).toFixed(1)}%</li>
              <li>Duración: {fmt(resultado.senales.duracion)}</li>
            </ul>
          </div>
        )}
      </section>

      <section className="card stack" aria-labelledby="cambia-personaje">
        <h2 id="cambia-personaje" className="title" style={{ fontSize: 'var(--fs-xl)' }}>
          Cambia la voz
        </h2>
        <p className="muted text-sm">
          Re-escribimos al instante, sin volver a analizar.
        </p>
        <PersonajeSelector value={personaje} onChange={cambiarPersonaje} />
      </section>

      <ButtonsBar onOtroGuion={regenerar} />
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

function etiquetaPista(p: NonNullable<Pista>): string {
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

/** Baraja un array de manera determinista con seed numérica (Fisher-Yates). */
function barajarEstable<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  let s = (seed | 0) || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s ^ (s >>> 13), 1597334677)) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}