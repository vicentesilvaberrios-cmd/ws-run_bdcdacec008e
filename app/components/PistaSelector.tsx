'use client';

// Pista (E2.1, E2.2): 6 tarjetas + opción discreta "mejor no te digo nada".
// Selección destacada. Persiste en localStorage.

import type { Pista } from '../../src/lib/tipos';
import { usePrefHydrated } from '../../src/lib/preferencias';

export interface PistaSelectorProps {
  value: Pista;
  onChange: (v: Pista) => void;
}

interface TarjetaPista {
  id: Exclude<Pista, null>;
  emoji: string;
  etiqueta: string;
}

const PISTAS: TarjetaPista[] = [
  { id: 'mirando', emoji: '👀', etiqueta: 'Me mira fijo' },
  { id: 'corriendo', emoji: '🏃', etiqueta: 'Corre como loco' },
  { id: 'puerta', emoji: '🚪', etiqueta: 'Está en la puerta' },
  { id: 'plato', emoji: '🥣', etiqueta: 'Cerca de su plato' },
  { id: 'retado', emoji: '🙅', etiqueta: 'Lo acabo de retar' },
  { id: 'despierto', emoji: '😴', etiqueta: 'Recién despertó' },
];

export default function PistaSelector({ value, onChange }: PistaSelectorProps) {
  const cambiar = usePrefHydrated('pista', value, onChange);

  const sinPista = value === null;

  return (
    <div>
      <div className="cluster" style={{ marginBottom: 'var(--sp-2)' }}>
        <label>¿Qué estaba haciendo?</label>
        <span
          className="help-tip"
          data-tip="Con pista, el diálogo habla de esa situación. Si dudas, elige la discreta."
          tabIndex={0}
          role="note"
          aria-label="Con pista, el diálogo habla de esa situación. Si dudas, elige la discreta."
        >
          ?
        </span>
      </div>
      <div className="tile-grid" role="radiogroup" aria-label="Pista: qué estaba haciendo">
        {PISTAS.map((p) => {
          const selected = value === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`tile${selected ? ' is-selected' : ''}`}
              onClick={() => cambiar(p.id)}
            >
              <span className="tile-emoji" aria-hidden="true">
                {p.emoji}
              </span>
              <span className="tile-label">{p.etiqueta}</span>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 'var(--sp-2)' }}>
        <button
          type="button"
          className={`btn btn-sm ${sinPista ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => cambiar(null)}
          aria-pressed={sinPista}
        >
          🙊 Mejor no te digo nada
        </button>
      </div>
    </div>
  );
}