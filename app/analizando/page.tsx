'use client';

// Pantalla de análisis (E3): 4 etapas secuenciales (~2.5–4s total).
// De fondo, un frame del video con blur. Cuando el análisis real termina, redirige a /resultado.

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AnalysisStage from './components/AnalysisStage';
import { useVideo } from '../components/VideoContext';
import { analizarVideo, generarMiniatura } from '../../src/lib/analizador';
import { getDialogo } from '../../src/lib/dialogo';
import { reescribirDialogo } from '../../src/lib/personajes';
import { guardarTraduccion } from '../../src/lib/db';

const ETAPAS = [
  { texto: 'Detectando a tu mascota', detalle: 'Buscando movimiento y forma en el cuadro' },
  { texto: 'Midiendo nivel de energía', detalle: 'Cuántas ráfagas de movimiento detectamos' },
  { texto: 'Escuchando vocalizaciones', detalle: 'Midiendo el volumen del audio' },
  { texto: 'Escribiendo el guion', detalle: 'Eligiendo las mejores frases' },
];

const DURACION_POR_ETAPA = 750; // ms → 4 * 750 = 3000ms total (dentro de 2.5-4s)

export default function Analizando() {
  const router = useRouter();
  const {
    video,
    videoBlob,
    especie,
    personaje,
    pista,
    setResultado,
    setDialogo,
    setRegistroActual,
    setMiniatura,
    reset,
  } = useVideo();
  const [etapaActual, setEtapaActual] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fondoUrl, setFondoUrl] = useState<string | null>(null);
  const yaAnalizoRef = useRef(false);

  // Redirige a / si no hay video
  useEffect(() => {
    if (!video || !videoBlob) {
      router.replace('/');
    }
  }, [video, videoBlob, router]);

  // Captura un frame del video para usarlo de fondo con blur.
  useEffect(() => {
    if (!videoBlob) return;
    let cancel = false;
    let url: string | null = null;
    (async () => {
      try {
        url = URL.createObjectURL(videoBlob);
        const v = document.createElement('video');
        v.src = url;
        v.muted = true;
        v.playsInline = true;
        await new Promise<void>((resolve, reject) => {
          v.onloadedmetadata = () => resolve();
          v.onerror = () => reject(new Error('No se pudo cargar el video'));
        });
        await new Promise<void>((resolve) => {
          const handler = () => {
            v.removeEventListener('seeked', handler);
            resolve();
          };
          v.addEventListener('seeked', handler);
          v.currentTime = Math.min(0.5, (v.duration || 1) / 2);
        });
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = Math.round((v.videoHeight / v.videoWidth) * 320) || 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const data = canvas.toDataURL('image/jpeg', 0.7);
          if (!cancel) setFondoUrl(data);
        }
      } catch {
        /* sin fondo, no es bloqueante */
      } finally {
        if (url) URL.revokeObjectURL(url);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [videoBlob]);

  // Avanza las etapas (timer artificial) y lanza el análisis real en paralelo.
  useEffect(() => {
    if (!video || !videoBlob) return;
    if (yaAnalizoRef.current) return;
    yaAnalizoRef.current = true;

    setEtapaActual(0);
    const timers: number[] = [];
    for (let i = 1; i < ETAPAS.length; i++) {
      const t = window.setTimeout(() => {
        setEtapaActual(i);
      }, i * DURACION_POR_ETAPA);
      timers.push(t);
    }

    let cancelado = false;
    const inicioShow = performance.now();
    (async () => {
      try {
        const r = await analizarVideo(videoBlob, especie);
        if (cancelado) return;
        setResultado(r);
        const mini = await generarMiniatura(videoBlob);
        if (!cancelado) setMiniatura(mini);
        // Diálogo: primero base del banco, luego se reescribe con el personaje elegido.
        const base = getDialogo(especie, r.clasificacion.animo, personaje, pista, r.senales);
        const dialogo = reescribirDialogo(base, personaje);
        setDialogo(dialogo);
        // Asegurar la duración mínima del show (>= 2.5s)
        const trans = performance.now() - inicioShow;
        const falta = ETAPAS.length * DURACION_POR_ETAPA - trans;
        if (falta > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, falta));
        }
        if (cancelado) return;
        setEtapaActual(ETAPAS.length);
        // Persistir al historial
        const id =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `t-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const registro = {
          id,
          creadoEn: Date.now(),
          especie,
          personaje,
          pista,
          animo: r.clasificacion.animo,
          certeza: r.clasificacion.certeza,
          lecturaPobre: r.clasificacion.lecturaPobre,
          senales: r.senales,
          dialogo,
          miniatura: mini,
          videoBlob,
          duracion: r.senales.duracion,
          ancho: r.ancho,
          alto: r.alto,
        };
        await guardarTraduccion(registro);
        setRegistroActual(registro);
        router.replace('/resultado');
      } catch (err) {
        if (cancelado) return;
        const msg =
          err instanceof Error ? err.message : 'No pudimos analizar el video. Inténtalo otra vez.';
        setError(msg);
      }
    })();

    return () => {
      cancelado = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [
    video,
    videoBlob,
    especie,
    personaje,
    pista,
    router,
    setResultado,
    setDialogo,
    setRegistroActual,
    setMiniatura,
  ]);

  if (!video) return null;

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '60vh',
        padding: 'var(--sp-5)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      {fondoUrl && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${fondoUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(18px) brightness(0.6)',
            transform: 'scale(1.1)',
            zIndex: 0,
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'var(--surface)',
          padding: 'var(--sp-5)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          maxWidth: 600,
          margin: '0 auto',
        }}
      >
        <h1 className="title" style={{ marginBottom: 'var(--sp-2)' }}>
          Analizando a tu mascota…
        </h1>
        <p className="muted" style={{ marginBottom: 'var(--sp-4)' }}>
          Estamos midiendo señales simples para inventar el doblaje. Esto toma solo unos segundos.
        </p>
        <ol className="stage-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {ETAPAS.map((e, i) => {
            const estado: 'pending' | 'active' | 'done' =
              i < etapaActual ? 'done' : i === etapaActual ? 'active' : 'pending';
            return <AnalysisStage key={i} texto={e.texto} detalle={e.detalle} estado={estado} />;
          })}
        </ol>
        {error && (
          <div className="alert alert-error mt-4" role="alert">
            {error}
            <div style={{ marginTop: 'var(--sp-2)' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => router.replace('/')}>
                Volver a Inicio
              </button>
            </div>
          </div>
        )}
        {!error && (
          <button
            type="button"
            className="btn btn-ghost btn-sm mt-4"
            onClick={() => {
              reset();
              router.replace('/');
            }}
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}