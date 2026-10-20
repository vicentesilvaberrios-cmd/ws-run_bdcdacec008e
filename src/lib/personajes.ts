// Personajes — definiciones de los 5 personajes disponibles.
// Cada uno tiene un "tono" que guía el estilo de las líneas (E4.4).
// `reescribirDialogo` reescribe las mismas ideas-base con el estilo del nuevo personaje,
// sin volver a analizar el video (mismas ideas → mismo fondo → solo cambia la voz).

import type { Animo, Personaje, Pista } from './tipos';

// Prefijos/sufijos/interjecciones típicos por personaje. La reescritura NO usa IA; es
// reempaquetado determinista de las mismas "ideas" que el analizador+diálogo ya eligieron.
export const PERSONAJES: Record<Personaje, {
  id: Personaje;
  nombre: string;
  descripcion: string;
  emoji: string;
  /** Interjecciones características al inicio de línea. */
  apertura: string[];
  /** Muletillas características al final de línea. */
  cierre: string[];
  /** Vocabulario típico (sustituye palabras neutras). */
  remplazos: Record<string, string>;
}> = {
  narrador: {
    id: 'narrador',
    nombre: 'El Narrador',
    descripcion: 'Voz grave de documental de naturaleza.',
    emoji: '🎙️',
    apertura: ['Observemos cómo', 'En este instante,', 'He aquí que'],
    cierre: ['—narra la historia.', '—canta el destino.', '—dicta la vida.'],
    remplazos: { 'muy': 'sumamente', 'rápido': 'veloz', 'lento': 'pausado' },
  },
  telenovela: {
    id: 'telenovela',
    nombre: 'La Telenovela',
    descripcion: 'Drama, suspiros, pasiones imposibles.',
    emoji: '💔',
    apertura: ['¡Ay, vida mía!', '¡No puede ser!', '¡Por todos los cielos!'],
    cierre: ['¡¿Y ahora qué hago?!', '¡Esto no se va a quedar así!', '¡Ay, mi corazón!'],
    remplazos: {
      'cola': 'corazón',
      'correr': 'volar hacia el destino',
      'mirar': 'clavar mi mirada en tu alma',
    },
  },
  abuela: {
    id: 'abuela',
    nombre: 'La Abuela',
    descripcion: 'Cariñosa, reposera, sabia.',
    emoji: '👵',
    apertura: ['Ay, mi niño,', 'Mi cielo,', 'Ven acá,'],
    cierre: ['andá con cuidado.', 'yo te lo dije.', 'mi amor.'],
    remplazos: {
      'jugar': 'jugar aleteando',
      'cama': 'la camita',
      'plato': 'el platito',
      'puerta': 'la puertita',
    },
  },
  coach: {
    id: 'coach',
    nombre: 'El Coach',
    descripcion: 'Motivador, gritón, powerpoints imaginarios.',
    emoji: '📣',
    apertura: ['¡Vamos, vamos!', '¡Eso es! ¡Eso es!', '¡Hoy es el día!'],
    cierre: ['¡Sin excusas!', '¡A romperla!', '¡El límite lo ponés vos!'],
    remplazos: {
      'jugar': 'entrenar',
      'correr': 'dar el máximo',
      'mirar': 'fijar el objetivo',
    },
  },
  sarcastico: {
    id: 'sarcastico',
    nombre: 'El Sarcástico',
    descripcion: 'Mirada crítica, ojo clínico.',
    emoji: '🙄',
    apertura: ['A ver,', 'No me digas que', 'Ajá, claro,'],
    cierre: ['—qué sorpresa.', '—qué original.', '—touché.'],
    remplazos: {
      'feliz': 'aparentemente feliz',
      'enojado': 'filosóficamente ofendido',
      'cansado': 'existencialmente cansado',
    },
  },
};

export const TODOS_LOS_PERSONAJES: Personaje[] = [
  'narrador',
  'telenovela',
  'abuela',
  'coach',
  'sarcastico',
];

/** Reescribe un diálogo existente aplicando el estilo del personaje, sin re-analizar. */
export function reescribirDialogo(dialogo: string[], personaje: Personaje): string[] {
  const p = PERSONAJES[personaje];
  // Hash determinista del diálogo original para elegir apertura/cierre estables.
  return dialogo.map((linea, i) => {
    const sem = pseudoSeed(linea + ':' + personaje + ':' + i);
    const apertura = p.apertura[sem % p.apertura.length];
    const cierre = p.cierre[(sem >> 3) % p.cierre.length];

    // Reemplazo de vocabulario: solo la primera coincidencia por palabra clave.
    let reescrita = linea;
    for (const [de, a] of Object.entries(p.remplazos)) {
      reescrita = reescrita.replace(new RegExp(`\\b${de}\\b`, 'i'), a);
    }
    // Quitar redundancias obvias: si la línea ya empieza con apertura del personaje, no duplicar.
    if (!linea.toLowerCase().startsWith(apertura.slice(0, 6).toLowerCase())) {
      reescrita = `${apertura} ${reescrita.charAt(0).toLowerCase() + reescrita.slice(1)}`;
    }
    reescrita = `${reescrita.replace(/[.!?]$/, '')} ${cierre}`;
    return reescrita;
  });
}

function pseudoSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Etiquetas visibles: nombre humano para UI y emoji por ánimo (separa presentación de datos).
export function emojiAnimo(animo: Animo): string {
  const mapa: Record<string, string> = {
    // perro
    'eufórico': '🤩',
    'jugueton': '🐶',
    'alerta': '👀',
    'curioso': '🤔',
    'quejandose': '😩',
    'zen': '😌',
    // gato
    'exigiendo': '😼',
    'caceria': '🐅',
    'conversador': '🗣️',
    'evaluandote': '🧐',
    'reclamando': '😾',
    'zen-absoluto': '🧘',
  };
  return mapa[animo] ?? '🐾';
}

export function etiquetaPista(p: Pista): string {
  const mapa: Record<Exclude<Pista, null>, string> = {
    mirando: 'Me mira fijo',
    corriendo: 'Corre como loco',
    puerta: 'Está en la puerta',
    plato: 'Cerca de su plato',
    retado: 'Lo acabo de retar',
    despierto: 'Recién despertó',
  };
  return p ? mapa[p] : 'Mejor no te digo nada';
}
