'use client';

// Selector de personaje (5 tarjetas con preview rápida). Persiste en localStorage.

import type { Personaje } from '../../src/lib/tipos';
import { PERSONAJES, TODOS_LOS_PERSONAJES } from '../../src/lib/personajes';
import { usePrefHydrated } from '../../src/lib/preferencias';

export interface PersonajeSelectorProps {
  value: Personaje;
  onChange: (v: Personaje) => void;
}

export default function PersonajeSelector({ value, onChange }: PersonajeSelectorProps) {
  const cambiar = usePrefHydrated('personaje', value, onChange);

  return (
    <div>
      <div className="cluster" style={{ marginBottom: 'var(--sp-2)' }}>
        <label>Voz del doblaje</label>
        <span
          className="help-tip"
          data-tip="Cambia el tono del doblaje. Lo reescribimos al instante, sin volver a analizar."
          tabIndex={0}
          role="note"
          aria-label="Cambia el tono del doblaje. Lo reescribimos al instante, sin volver a analizar."
        >
          ?
        </span>
      </div>
      <div className="tile-grid" role="radiogroup" aria-label="Personaje del doblaje">
        {TODOS_LOS_PERSONAJES.map((id) => {
          const p = PERSONAJES[id];
          const selected = value === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`tile tile-compact${selected ? ' is-selected' : ''}`}
              onClick={() => cambiar(id)}
            >
              <span className="tile-emoji" aria-hidden="true">
                {p.emoji}
              </span>
              <span className="tile-label">{p.nombre.replace(/^El |^La /, '')}</span>
            </button>
          );
        })}
      </div>
      <p className="muted text-sm" style={{ marginTop: 'var(--sp-2)' }}>
        {PERSONAJES[value].descripcion}
      </p>
    </div>
  );
}