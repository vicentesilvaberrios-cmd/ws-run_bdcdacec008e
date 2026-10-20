// Wrapper de speechSynthesis (E4.9). Filtra voces es-* (español) y reproduce líneas
// usando la voz guardada en preferencias, si existe; si no, la mejor disponible.

import type { Personaje } from './tipos';

export interface VozDisponible {
  nombre: string;
  lang: string;
}

/** Lista todas las voces con lang 'es-*'. Si no hay ninguna, devuelve []. */
export function getVozDisponible(): VozDisponible[] {
  if (typeof speechSynthesis === 'undefined') return [];
  const voces = speechSynthesis.getVoices();
  return voces
    .filter((v) => /^es[-_]/i.test(v.lang))
    .map((v) => ({ nombre: v.name, lang: v.lang }));
}

/** Devuelve la mejor voz para reproducir: preferida por nombre, si no, la primera es-*. */
export function elegirVoz(nombrePreferido?: string): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === 'undefined') return null;
  const voces = speechSynthesis.getVoices();
  if (voces.length === 0) return null;

  if (nombrePreferido) {
    const exacta = voces.find((v) => v.name === nombrePreferido);
    if (exacta) return exacta;
    const parcial = voces.find((v) =>
      v.name.toLowerCase().includes(nombrePreferido.toLowerCase()),
    );
    if (parcial) return parcial;
  }

  return (
    voces.find((v) => /^es[-_]ES/i.test(v.lang)) ??
    voces.find((v) => /^es[-_]/i.test(v.lang)) ??
    voces[0]
  );
}

/** Reproduce una línea con la voz indicada (o la mejor disponible). */
export function speakLine(
  texto: string,
  opts?: { vozNombre?: string; personaje?: Personaje; velocidad?: number },
): void {
  if (typeof speechSynthesis === 'undefined' || !texto) return;
  // Cancelar cualquier cosa en cola para que se note el cambio.
  try {
    speechSynthesis.cancel();
  } catch {
    /* noop */
  }
  const voz = elegirVoz(opts?.vozNombre);
  const utter = new SpeechSynthesisUtterance(texto);
  if (voz) utter.voice = voz;
  utter.lang = voz?.lang ?? 'es-ES';
  utter.rate = clamp(opts?.velocidad ?? velocidadParaPersonaje(opts?.personaje), 0.6, 1.4);
  utter.pitch = pitchParaPersonaje(opts?.personaje);
  utter.volume = 1;
  try {
    speechSynthesis.speak(utter);
  } catch {
    // Algunos navegadores lanzan si no hay voces cargadas; silenciar.
  }
}

/** Cancela toda reproducción en curso. */
export function stopSpeaking(): void {
  if (typeof speechSynthesis === 'undefined') return;
  try {
    speechSynthesis.cancel();
  } catch {
    /* noop */
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function velocidadParaPersonaje(p?: Personaje): number {
  switch (p) {
    case 'coach':
      return 1.2;
    case 'telenovela':
      return 1.05;
    case 'narrador':
      return 0.9;
    case 'abuela':
      return 0.85;
    case 'sarcastico':
      return 0.95;
    default:
      return 1;
  }
}

function pitchParaPersonaje(p?: Personaje): number {
  switch (p) {
    case 'telenovela':
      return 1.2;
    case 'abuela':
      return 0.95;
    case 'sarcastico':
      return 0.9;
    case 'coach':
      return 1.05;
    case 'narrador':
      return 0.85;
    default:
      return 1;
  }
}
