'use client';

// Grabación con webcam (E1.5): getUserMedia + MediaRecorder.
// Mínimo 2 s, máximo 10 s, con cuenta regresiva y corte automático.

import { useCallback, useEffect, useRef, useState } from 'react';

const DUR_MIN = 2;
const DUR_MAX = 10;

export interface WebcamRecorderProps {
  onGrabacion: (blob: Blob, duracion: number) => void;
  onError?: (mensaje: string) => void;
}

type Estado =
  | { tipo: 'inactivo' }
  | { tipo: 'pidiendo' }
  | { tipo: 'cuentaRegresiva'; restantes: number }
  | { tipo: 'grabando'; restantes: number }
  | { tipo: 'revisando'; blob: Blob; url: string; duracion: number }
  | { tipo: 'error'; mensaje: string };

export default function WebcamRecorder({ onGrabacion, onError }: WebcamRecorderProps) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'inactivo' });
  const [abierto, setAbierto] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const inicioRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canceladoRef = useRef(false);

  const limpiar = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch {
        /* noop */
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      canceladoRef.current = true;
      limpiar();
      if (estado.tipo === 'revisando') URL.revokeObjectURL(estado.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function mensajeError(err: unknown): string {
    const e = err as DOMException;
    if (!e) return 'No pudimos leer tu cámara. Usa arrastrar y soltar mientras tanto.';
    if (e.name === 'NotAllowedError' || e.name === 'SecurityError') {
      return 'Nos bloqueaste la cámara. Permítela en tu navegador y vuelve a intentarlo.';
    }
    if (e.name === 'NotFoundError' || e.name === 'OverconstrainedError') {
      return 'No encontramos una cámara conectada. Usa arrastrar y soltar mientras tanto.';
    }
    return 'No pudimos leer tu cámara. Usa arrastrar y soltar mientras tanto.';
  }

  async function empezar() {
    canceladoRef.current = false;
    setAbierto(true);
    setEstado({ tipo: 'pidiendo' });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
      if (canceladoRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      // Mostrar preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      // Cuenta regresiva 3s
      let restantes = 3;
      setEstado({ tipo: 'cuentaRegresiva', restantes });
      timerRef.current = window.setInterval(() => {
        restantes -= 1;
        if (restantes <= 0) {
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          iniciarGrabacion();
        } else {
          setEstado({ tipo: 'cuentaRegresiva', restantes });
        }
      }, 1000);
    } catch (err) {
      const mensaje = mensajeError(err);
      setEstado({ tipo: 'error', mensaje });
      onError?.(mensaje);
    }
  }

  function iniciarGrabacion() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : '';
    const recorder = mime
      ? new MediaRecorder(streamRef.current, { mimeType: mime })
      : new MediaRecorder(streamRef.current);
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const duracion = (performance.now() - inicioRef.current) / 1000;
      // Detener tracks de la cámara
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (canceladoRef.current) {
        URL.revokeObjectURL(url);
        return;
      }
      if (duracion < DUR_MIN) {
        URL.revokeObjectURL(url);
        setEstado({
          tipo: 'error',
          mensaje: 'Grabaste menos de 2 segundos. Inténtalo de nuevo.',
        });
        return;
      }
      setEstado({ tipo: 'revisando', blob, url, duracion });
    };
    inicioRef.current = performance.now();
    recorder.start();
    setEstado({ tipo: 'grabando', restantes: DUR_MAX });
    timerRef.current = window.setInterval(() => {
      const trans = (performance.now() - inicioRef.current) / 1000;
      const restantes = Math.max(0, Math.ceil(DUR_MAX - trans));
      if (restantes <= 0) {
        // Corte automático
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
          try {
            recorderRef.current.stop();
          } catch {
            /* noop */
          }
        }
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        setEstado({ tipo: 'grabando', restantes });
      }
    }, 250);
  }

  function detener() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch {
        /* noop */
      }
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function usar() {
    if (estado.tipo === 'revisando') {
      onGrabacion(estado.blob, estado.duracion);
      URL.revokeObjectURL(estado.url);
      setAbierto(false);
      setEstado({ tipo: 'inactivo' });
    }
  }

  function descartar() {
    if (estado.tipo === 'revisando') URL.revokeObjectURL(estado.url);
    setAbierto(false);
    setEstado({ tipo: 'inactivo' });
  }

  function cerrar() {
    canceladoRef.current = true;
    limpiar();
    if (estado.tipo === 'revisando') URL.revokeObjectURL(estado.url);
    setAbierto(false);
    setEstado({ tipo: 'inactivo' });
  }

  if (!abierto) {
    return (
      <button
        type="button"
        className="btn btn-ghost"
        onClick={empezar}
        aria-label="Grabar un video con la cámara web"
      >
        🎥 Grabar con la webcam
        <span
          className="help-tip"
          data-tip="Graba hasta 10 segundos desde tu cámara. Sin subir nada."
          tabIndex={0}
          role="note"
          aria-label="Graba hasta 10 segundos desde tu cámara. Sin subir nada."
        >
          ?
        </span>
      </button>
    );
  }

  return (
    <div
      className="card stack"
      role="dialog"
      aria-modal="true"
      aria-label="Grabación con la cámara web"
    >
      <div className="cluster justify-between">
        <strong>Cámara web</strong>
        <button type="button" className="btn btn-ghost btn-sm" onClick={cerrar}>
          Cerrar
        </button>
      </div>

      {estado.tipo === 'pidiendo' && (
        <div className="muted">Pidiendo permiso para usar la cámara…</div>
      )}

      {estado.tipo === 'error' && (
        <div className="alert alert-error">{estado.mensaje}</div>
      )}

      {estado.tipo !== 'error' && estado.tipo !== 'revisando' && (
        <div style={{ position: 'relative' }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              borderRadius: 'var(--radius-sm)',
              background: '#000',
              transform: 'scaleX(-1)',
            }}
            aria-label="Vista previa de la cámara"
          />
          {estado.tipo === 'cuentaRegresiva' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 'var(--fs-3xl)',
                fontWeight: 700,
                textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                pointerEvents: 'none',
              }}
              aria-live="polite"
            >
              {estado.restantes}
            </div>
          )}
          {estado.tipo === 'grabando' && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: 'rgba(220, 38, 38, 0.85)',
                color: 'white',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: 'var(--fs-sm)',
              }}
              aria-live="polite"
            >
              ● Grabando · {estado.restantes}s
            </div>
          )}
        </div>
      )}

      {estado.tipo === 'revisando' && (
        <>
          <video
            src={estado.url}
            controls
            style={{ width: '100%', borderRadius: 'var(--radius-sm)', background: '#000' }}
            aria-label="Vista previa de la grabación"
          />
          <div className="muted text-sm">
            Duración: {estado.duracion.toFixed(1)}s
          </div>
        </>
      )}

      <div className="cluster">
        {estado.tipo === 'grabando' && (
          <button type="button" className="btn btn-danger btn-sm" onClick={detener}>
            Detener ahora
          </button>
        )}
        {estado.tipo === 'revisando' && (
          <>
            <button type="button" className="btn btn-primary" onClick={usar}>
              Usar este video
            </button>
            <button type="button" className="btn btn-ghost" onClick={descartar}>
              Grabar de nuevo
            </button>
          </>
        )}
      </div>
    </div>
  );
}