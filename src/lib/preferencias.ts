// Preferencias persistidas en localStorage (spec 1.4 / 3.6).
// Claves: pref.personaje, pref.especie, pref.pista, pref.voz.
// Cargadas al montar; escritas al cambiar.

import type { Especie, Personaje, Pista } from './tipos';

export interface Preferencias {
  personaje: Personaje;
  especie: Especie;
  pista: Pista;
  /** Nombre de la voz preferida (string vacío = sin preferencia). */
  voz: string;
}

const KEY_PERSONAJE = 'pref.personaje';
const KEY_ESPECIE = 'pref.especie';
const KEY_PISTA = 'pref.pista';
const KEY_VOZ = 'pref.voz';

export const PREFERENCIAS_POR_DEFECTO: Preferencias = {
  personaje: 'narrador',
  especie: 'perro',
  pista: null,
  voz: '',
};

function safeGet(key: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Modo privado / cuota llena: ignorar.
  }
}

/** Lee todas las preferencias del localStorage. Falla seguro a defaults. */
export function loadPreferences(): Preferencias {
  const personaje = safeGet(KEY_PERSONAJE) as Personaje | null;
  const especie = safeGet(KEY_ESPECIE) as Especie | null;
  const pistaRaw = safeGet(KEY_PISTA);
  const voz = safeGet(KEY_VOZ) ?? '';

  return {
    personaje: esPersonajeValido(personaje) ? personaje : PREFERENCIAS_POR_DEFECTO.personaje,
    especie: especie === 'perro' || especie === 'gato'
      ? especie
      : PREFERENCIAS_POR_DEFECTO.especie,
    pista: esPistaValida(pistaRaw) ? pistaRaw : PREFERENCIAS_POR_DEFECTO.pista,
    voz,
  };
}

/** Persiste una preferencia individual. */
export function savePreference<K extends keyof Preferencias>(
  clave: K,
  valor: Preferencias[K],
): void {
  switch (clave) {
    case 'personaje':
      safeSet(KEY_PERSONAJE, String(valor));
      break;
    case 'especie':
      safeSet(KEY_ESPECIE, String(valor));
      break;
    case 'pista':
      safeSet(KEY_PISTA, valor == null ? '' : String(valor));
      break;
    case 'voz':
      safeSet(KEY_VOZ, String(valor));
      break;
  }
}

// Validadores --------------------------------------------------

const PERSONAJES_VALIDOS: Personaje[] = [
  'narrador',
  'telenovela',
  'abuela',
  'coach',
  'sarcastico',
];

const PISTAS_VALIDAS: (Exclude<Pista, null> | '')[] = [
  '',
  'mirando',
  'corriendo',
  'puerta',
  'plato',
  'retado',
  'despierto',
];

function esPersonajeValido(v: string | null): v is Personaje {
  return !!v && (PERSONAJES_VALIDOS as string[]).includes(v);
}

function esPistaValida(v: string | null): v is Pista {
  return v !== null && (PISTAS_VALIDAS as string[]).includes(v);
}
