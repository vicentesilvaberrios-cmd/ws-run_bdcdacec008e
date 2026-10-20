// Matriz de prueba (E10 / criterio 4): 6 ánimos por especie = 12 celdas.
// Cada celda expone señales simuladas que, pasadas por el analizador, producen un ánimo
// DISTINTO. Sirve como página /matriz: confirma que la heurística clasifica bien.

import { deductAnimo, mapearAnimo } from './analizador';
import type { Animo, AnimoGato, AnimoPerro, Clasificacion, Especie, Senales } from './tipos';

export interface CeldaMatriz {
  especie: Especie;
  animo: Animo;
  senales: Senales;
  clasificacion: Clasificacion;
}

/** 6 ánimos canónicos (perro); para gato se mapean via mapearAnimo. */
const ANIMOS_PERRO: AnimoPerro[] = [
  'eufórico',
  'jugueton',
  'alerta',
  'curioso',
  'quejandose',
  'zen',
];

/** Senales prototipo por ánimo canónico (perro). */
const PROTOTIPOS: Record<AnimoPerro, Senales> = {
  eufórico:   { movimiento: 0.92, rafagas: 7, brillo: 200, contraste: 22, zona: 0.10, audio: 0.18, duracion: 6.0 },
  jugueton:   { movimiento: 0.68, rafagas: 5, brillo: 170, contraste: 18, zona: 0.25, audio: 0.05, duracion: 5.0 },
  alerta:     { movimiento: 0.46, rafagas: 2, brillo: 120, contraste: 14, zona: -0.10, audio: 0.03, duracion: 4.0 },
  curioso:    { movimiento: 0.32, rafagas: 2, brillo: 140, contraste: 16, zona: 0.05, audio: 0.02, duracion: 4.5 },
  quejandose: { movimiento: 0.20, rafagas: 1, brillo: 110, contraste: 10, zona: -0.20, audio: 0.12, duracion: 3.5 },
  zen:        { movimiento: 0.06, rafagas: 0, brillo: 95,  contraste: 4,  zona: 0.00, audio: 0.01, duracion: 8.0 },
};

/** Devuelve las 12 celdas (perro y gato × 6 ánimos) ya clasificadas. */
export function obtenerMatriz(): CeldaMatriz[] {
  const celdas: CeldaMatriz[] = [];

  // Perro: ánimos del catálogo de perro.
  for (const animo of ANIMOS_PERRO) {
    const senales = { ...PROTOTIPOS[animo] };
    const c = deductAnimo(senales, 'perro');
    celdas.push({ especie: 'perro', animo, senales, clasificacion: c });
  }

  // Gato: para cada "ánimo canónico" equivalente, mapear al ánimo del gato.
  for (const animo of ANIMOS_PERRO) {
    const senales = { ...PROTOTIPOS[animo] };
    const animoGato = mapearAnimo(animo, 'gato') as AnimoGato;
    const c = deductAnimo(senales, 'gato');
    celdas.push({ especie: 'gato', animo: animoGato, senales, clasificacion: c });
  }

  return celdas;
}
