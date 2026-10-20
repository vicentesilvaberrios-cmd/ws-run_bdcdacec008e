'use client';

// Toggle perro/gato. Persiste en localStorage (vía preferencias helper).

import type { Especie } from '../../src/lib/tipos';
import { usePrefHydrated } from '../../src/lib/preferencias';

export interface EspecieSelectorProps {
  value: Especie;
  onChange: (v: Especie) => void;
}

export default function EspecieSelector({ value, onChange }: EspecieSelectorProps) {
  const cambiar = usePrefHydrated('especie', value, onChange);

  return (
    <div role="radiogroup" aria-label="Especie" className="seg">
      <button
        type="button"
        role="radio"
        aria-checked={value === 'perro'}
        className={value === 'perro' ? 'is-active' : ''}
        onClick={() => cambiar('perro')}
      >
        🐶 Perro
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === 'gato'}
        className={value === 'gato' ? 'is-active' : ''}
        onClick={() => cambiar('gato')}
      >
        🐱 Gato
      </button>
    </div>
  );
}
