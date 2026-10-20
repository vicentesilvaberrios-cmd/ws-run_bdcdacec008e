// Tipos centrales de la app. Una sola fuente de verdad.

export type Especie = 'perro' | 'gato';

export type Personaje =
  | 'narrador'
  | 'telenovela'
  | 'abuela'
  | 'coach'
  | 'sarcastico';

export type Pista =
  | 'mirando'
  | 'corriendo'
  | 'puerta'
  | 'plato'
  | 'retado'
  | 'despierto'
  | null; // null = "mejor no te digo nada"

export type AnimoPerro =
  | 'eufórico'
  | 'jugueton'
  | 'alerta'
  | 'curioso'
  | 'quejandose'
  | 'zen';

export type AnimoGato =
  | 'exigiendo'
  | 'caceria'
  | 'conversador'
  | 'evaluandote'
  | 'reclamando'
  | 'zen-absoluto';

export type Animo = AnimoPerro | AnimoGato;

// Señales extraídas del video. Todas normalizadas a rangos estables.
export interface Senales {
  /** Promedio de movimiento entre frames (0..1). */
  movimiento: number;
  /** Picos de movimiento detectados (ráfagas). 0..N. */
  rafagas: number;
  /** Brillo promedio del cuadro central (0..255). */
  brillo: number;
  /** Varianza de brillo entre frames (cuánto cambia la luz). */
  contraste: number;
  /** Cuadros donde la "mascota" ocupa la mitad izquierda / derecha / centro (-1..1). */
  zona: number;
  /** Energía RMS de la pista de audio (0..1 aprox.). */
  audio: number;
  /** Duración del video en segundos. */
  duracion: number;
}

export interface Clasificacion {
  animo: Animo;
  /** 0..100. Es la "certeza honesta" — con señales pobres será baja. */
  certeza: number;
  /** true si la señal es tan débil que mejor decir "no pude leer nada". */
  lecturaPobre: boolean;
}

export interface RegistroTraduccion {
  id: string;
  creadoEn: number;
  especie: Especie;
  personaje: Personaje;
  pista: Pista;
  animo: Animo;
  certeza: number;
  lecturaPobre: boolean;
  senales: Senales;
  dialogo: string[];
  miniatura: Blob | null;
  videoBlob: Blob | null;
  duracion: number;
  ancho: number;
  alto: number;
}
