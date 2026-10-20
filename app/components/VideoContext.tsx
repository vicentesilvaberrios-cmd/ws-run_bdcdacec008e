'use client';

// Contexto global: estado del video en curso + resultado del análisis.
// Permite que /analizando y /resultado compartan datos sin recargar.
// (Sin localStorage: solo en memoria; al recargar o cambiar de ruta fuera del flujo, se pierde.)

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ResultadoAnalisis } from '../../src/lib/analizador';
import type {
  Especie,
  Personaje,
  Pista,
  RegistroTraduccion,
} from '../../src/lib/tipos';

export interface VideoEnCurso {
  file: File;
  blobUrl: string;
  ancho: number;
  alto: number;
}

export interface EstadoVideo {
  /** Archivo cargado y URL de objeto (revocable). */
  video: VideoEnCurso | null;
  /** Especie seleccionada. */
  especie: Especie;
  /** Personaje seleccionado. */
  personaje: Personaje;
  /** Pista seleccionada (null = "mejor no te digo nada"). */
  pista: Pista;
  /** Resultado del análisis más reciente. */
  resultado: ResultadoAnalisis | null;
  /** Diálogo calculado. */
  dialogo: string[];
  /** Registro persistido en IndexedDB (cuando aplica). */
  registroActual: RegistroTraduccion | null;
  /** Última miniatura JPEG (para pasarla al registro). */
  miniatura: Blob | null;
  /** Último blob de video crudo. */
  videoBlob: Blob | null;
}

export interface VideoContextValue extends EstadoVideo {
  setVideo: (v: VideoEnCurso | null) => void;
  setEspecie: (e: Especie) => void;
  setPersonaje: (p: Personaje) => void;
  setPista: (p: Pista) => void;
  setResultado: (r: ResultadoAnalisis | null) => void;
  setDialogo: (d: string[]) => void;
  setRegistroActual: (r: RegistroTraduccion | null) => void;
  setMiniatura: (m: Blob | null) => void;
  setVideoBlob: (b: Blob | null) => void;
  /** Restaura todo a defaults; libera blob URL. */
  reset: () => void;
}

const VALORES_INICIALES: EstadoVideo = {
  video: null,
  especie: 'perro',
  personaje: 'narrador',
  pista: null,
  resultado: null,
  dialogo: [],
  registroActual: null,
  miniatura: null,
  videoBlob: null,
};

const VideoContext = createContext<VideoContextValue | null>(null);

export function VideoProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoVideo>(VALORES_INICIALES);

  const setVideo = useCallback((video: VideoEnCurso | null) => {
    setEstado((e) => {
      if (e.video && e.video.blobUrl && e.video.blobUrl !== video?.blobUrl) {
        URL.revokeObjectURL(e.video.blobUrl);
      }
      return { ...e, video };
    });
  }, []);

  const setEspecie = useCallback((especie: Especie) => {
    setEstado((e) => ({ ...e, especie }));
  }, []);

  const setPersonaje = useCallback((personaje: Personaje) => {
    setEstado((e) => ({ ...e, personaje }));
  }, []);

  const setPista = useCallback((pista: Pista) => {
    setEstado((e) => ({ ...e, pista }));
  }, []);

  const setResultado = useCallback((resultado: ResultadoAnalisis | null) => {
    setEstado((e) => ({ ...e, resultado }));
  }, []);

  const setDialogo = useCallback((dialogo: string[]) => {
    setEstado((e) => ({ ...e, dialogo }));
  }, []);

  const setRegistroActual = useCallback((registroActual: RegistroTraduccion | null) => {
    setEstado((e) => ({ ...e, registroActual }));
  }, []);

  const setMiniatura = useCallback((miniatura: Blob | null) => {
    setEstado((e) => ({ ...e, miniatura }));
  }, []);

  const setVideoBlob = useCallback((videoBlob: Blob | null) => {
    setEstado((e) => ({ ...e, videoBlob }));
  }, []);

  const reset = useCallback(() => {
    setEstado((e) => {
      if (e.video?.blobUrl) URL.revokeObjectURL(e.video.blobUrl);
      return VALORES_INICIALES;
    });
  }, []);

  const value = useMemo<VideoContextValue>(
    () => ({
      ...estado,
      setVideo,
      setEspecie,
      setPersonaje,
      setPista,
      setResultado,
      setDialogo,
      setRegistroActual,
      setMiniatura,
      setVideoBlob,
      reset,
    }),
    [
      estado,
      setVideo,
      setEspecie,
      setPersonaje,
      setPista,
      setResultado,
      setDialogo,
      setRegistroActual,
      setMiniatura,
      setVideoBlob,
      reset,
    ],
  );

  return <VideoContext.Provider value={value}>{children}</VideoContext.Provider>;
}

export function useVideo(): VideoContextValue {
  const ctx = useContext(VideoContext);
  if (!ctx) throw new Error('useVideo debe usarse dentro de <VideoProvider>');
  return ctx;
}

// Helpers de formato (los reutilizamos en distintos componentes)
export function fmtDuracion(s: number): string {
  return `${s.toFixed(1)}s`;
}

export function fmtTiempoRelativo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'hace un momento';
  if (diff < 3_600_000) return `hace ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `hace ${Math.floor(diff / 3_600_000)} h`;
  if (diff < 7 * 86_400_000) return `hace ${Math.floor(diff / 86_400_000)} d`;
  return new Date(ts).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
}