'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DropZone from './components/DropZone';
import VideoPreview from './components/VideoPreview';
import EspecieSelector from './components/EspecieSelector';
import PersonajeSelector from './components/PersonajeSelector';
import PistaSelector from './components/PistaSelector';
import WebcamRecorder from './components/WebcamRecorder';
import { useVideo } from './components/VideoContext';
import type { TipoEjemplo } from '../src/lib/ejemplos';
import { emojiAnimo } from '../src/lib/personajes';

interface EjemploResumen {
  tipo: TipoEjemplo;
  url: string;
  descripcion: string;
}

export default function Portada() {
  const router = useRouter();
  const {
    video,
    especie,
    personaje,
    pista,
    setVideo,
    setEspecie,
    setPersonaje,
    setPista,
    setVideoBlob,
    reset,
  } = useVideo();

  const [error, setError] = useState<string | null>(null);
  const [cargandoEjemplos, setCargandoEjemplos] = useState(true);
  const [ejemplos, setEjemplos] = useState<EjemploResumen[]>([]);

  useEffect(() => {
    // Reset al entrar a portada si no hay video (comportamiento de "N").
    if (!video) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancel = false;
    setCargandoEjemplos(true);
    import('../src/lib/ejemplos')
      .then((mod) => mod.obtenerEjemplos())
      .then((lista) => {
        if (cancel) return;
        setEjemplos(
          lista.map((e) => ({ tipo: e.tipo, url: e.url, descripcion: e.descripcion })),
        );
        setCargandoEjemplos(false);
      })
      .catch(() => {
        if (cancel) return;
        setCargandoEjemplos(false);
      });
    return () => {
      cancel = true;
    };
  }, []);

  async function cargarArchivo(file: File, meta: { duracion: number; ancho: number; alto: number }) {
    setError(null);
    // Revocar blob URL anterior si lo hay
    if (video?.blobUrl) URL.revokeObjectURL(video.blobUrl);
    const blobUrl = URL.createObjectURL(file);
    setVideo({ file, blobUrl, ancho: meta.ancho, alto: meta.alto });
    setVideoBlob(file);
  }

  async function cargarEjemplo(tipo: TipoEjemplo) {
    setError(null);
    try {
      const mod = await import('../src/lib/ejemplos');
      const lista = await mod.obtenerEjemplos();
      const ej = lista.find((e) => e.tipo === tipo);
      if (!ej) return;
      const nombre = `ejemplo-${tipo}.webm`;
      const file = new File([ej.blob], nombre, { type: 'video/webm' });
      const blobUrl = ej.url;
      setVideo({ file, blobUrl, ancho: 240, alto: 180 });
      setVideoBlob(ej.blob);
    } catch {
      setError('No pudimos cargar los ejemplos. Recarga la página.');
    }
  }

  async function cargarDeWebcam(blob: Blob, _duracion: number) {
    setError(null);
    const file = new File([blob], 'webcam.webm', { type: 'video/webm' });
    if (video?.blobUrl) URL.revokeObjectURL(video.blobUrl);
    const blobUrl = URL.createObjectURL(blob);
    setVideo({ file, blobUrl, ancho: 640, alto: 480 });
    setVideoBlob(blob);
  }

  function traducir() {
    router.push('/analizando');
  }

  function quitar() {
    setVideo(null);
    setVideoBlob(null);
  }

  return (
    <div className="stack">
      <header>
        <h1>🐾 Que Dice Mi Mascota</h1>
        <p className="subtitle">
          Sube un video corto de tu perro o gato y le pondremos un doblaje inventado.
          Solo para reírnos.
        </p>
      </header>

      {!video && (
        <>
          <p className="muted text-sm">
            Arrastra un video de 2 a 60 segundos o prueba con uno de los ejemplos.
          </p>
          <DropZone
            onArchivo={cargarArchivo}
            onError={(m) => setError(m)}
          />
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <div className="cluster" style={{ alignItems: 'flex-start' }}>
            <WebcamRecorder onGrabacion={cargarDeWebcam} onError={(m) => setError(m)} />
            <span
              className="help-tip"
              data-tip="Graba hasta 10 segundos desde tu cámara. Sin subir nada."
              tabIndex={0}
              role="note"
              aria-label="Graba hasta 10 segundos desde tu cámara. Sin subir nada."
            >
              ?
            </span>
          </div>

          <section aria-labelledby="ejemplos-heading">
            <h2 id="ejemplos-heading" className="title" style={{ marginBottom: 'var(--sp-2)' }}>
              Pruébalo con un ejemplo
            </h2>
            <p className="muted text-sm" style={{ marginBottom: 'var(--sp-3)' }}>
              Videos generados por nosotros. Un clic los analiza al instante.{' '}
              <span
                className="help-tip"
                data-tip="Cada ejemplo muestra un nivel distinto de movimiento para que veas ánimos diferentes."
                tabIndex={0}
                role="note"
                aria-label="Cada ejemplo muestra un nivel distinto de movimiento para que veas ánimos diferentes."
              >
                ?
              </span>
            </p>
            <div className="grid grid-sm-2 grid-md-3">
              {(['movido', 'intermedio', 'quieto'] as TipoEjemplo[]).map((tipo) => {
                const ej = ejemplos.find((e) => e.tipo === tipo);
                const label =
                  tipo === 'movido' ? 'Muy movido' : tipo === 'quieto' ? 'Casi quieto' : 'Intermedio';
                const emoji =
                  tipo === 'movido' ? emojiAnimo('eufórico') : tipo === 'quieto' ? emojiAnimo('zen') : emojiAnimo('curioso');
                return (
                  <button
                    key={tipo}
                    type="button"
                    className="card stack"
                    style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid var(--border)' }}
                    onClick={() => cargarEjemplo(tipo)}
                    disabled={cargandoEjemplos}
                    aria-label={`Cargar ejemplo ${label}`}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: 140,
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface-2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        border: '1px solid var(--border)',
                      }}
                      aria-hidden="true"
                    >
                      {ej ? '🎬' : (cargandoEjemplos ? '⏳' : '🎬')}
                    </div>
                    <strong>
                      {emoji} {label}
                    </strong>
                    <span className="muted text-sm">
                      {ej?.descripcion ?? (cargandoEjemplos ? 'Generando…' : 'No disponible')}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}

      {video && (
        <>
          <VideoPreview
            src={video.blobUrl}
            nombreArchivo={video.file.name}
            onQuitar={quitar}
          />
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}
          <div className="card stack">
            <h2 className="title">Cuéntanos un poco más</h2>
            <p className="muted text-sm">
              Si no cambias nada, usaremos tu última elección guardada y la pista neutra.
            </p>
            <div className="cluster">
              <EspecieSelector value={especie} onChange={setEspecie} />
            </div>
            <PersonajeSelector value={personaje} onChange={setPersonaje} />
            <PistaSelector value={pista} onChange={setPista} />
          </div>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={traducir}
            style={{ minHeight: 56, fontSize: 'var(--fs-lg)' }}
          >
            Traducir →
          </button>
        </>
      )}
    </div>
  );
}