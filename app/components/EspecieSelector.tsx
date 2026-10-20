'use client';

// Toggle perro/gato. Persiste en localStorage (vía preferencias helper).

import { useEffect, useState } from 'react';
import type { Especie } from '../../src/lib/tipos';
import { loadPreferences, savePreference } from '../../src/lib/preferencias';

export interface EspecieSelectorProps {
  value: Especie;
  onChange: (v: Especie) => void;
}

export default function EspecieSelector({ value, onChange }: EspecieSelectorProps) {
  // Hidratar desde preferencias en el primer render (cliente)
  const [, setHydrated] = useState(false);
  useEffect(() => {
    const pref = loadPreferences();
    if (pref.especie !== value) onChange(pref.especie);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cambiar(v: Especie) {
    onChange(v);
    savePreference('especie', v);
  }

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