'use client';

// Nota de honestidad (E9.1): banner inferior fijo que recuerda que es un juego,
// sin destruir la diversión. Cierre manual con persistencia ligera en localStorage.

import { useEffect, useState } from 'react';

const KEY = 'pref.honestyDismissed';

export default function HonestyNote() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(KEY);
      if (dismissed !== '1') setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function cerrar() {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ignorar */
    }
    setVisible(false);
  }

  return (
    <div className="honesty" role="note" aria-label="Aviso sobre el juego">
      <div className="alert alert-info" style={{ display: 'flex', gap: 'var(--sp-4)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 280px' }}>
          <strong>Esto es un juego, no magia.</strong>{' '}
          <span className="muted">
            Inventamos el diálogo a partir de señales simples (movimiento, brillo, audio).
            No leemos la mente de tu mascota. Pero mola pasarla bien. 😉
          </span>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={cerrar} aria-label="Cerrar aviso">
          Entendido
        </button>
      </div>
    </div>
  );
}