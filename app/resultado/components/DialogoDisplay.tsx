'use client';

// Diálogo escrito con efecto máquina de escribir (E4.2).
// Las líneas aparecen al ritmo del video (3–4 líneas en ~2.5–4s).

import { useEffect, useState } from 'react';

export interface DialogoDisplayProps {
  dialogo: string[];
  /** Duración total del video en segundos. */
  duracion: number;
  /** Si true, muestra toda la transcripción sin animación. */
  mostrarCompleto?: boolean;
}

export default function DialogoDisplay({
  dialogo,
  duracion,
  mostrarCompleto = false,
}: DialogoDisplayProps) {
  const [lineaActual, setLineaActual] = useState(-1);
  const [chars, setChars] = useState(0);

  // Calcula el tiempo por línea = duracion / lineas (para mostrar la siguiente cada X s).
  const tiempoPorLinea = dialogo.length > 0 ? Math.max(1.2, duracion / dialogo.length) : 1;

  useEffect(() => {
    setLineaActual(-1);
    setChars(0);
    if (mostrarCompleto) {
      setLineaActual(dialogo.length);
      return;
    }
    if (dialogo.length === 0) return;
    let linea = 0;
    let cancelado = false;

    function mostrarLinea(i: number) {
      if (cancelado) return;
      setLineaActual(i);
      setChars(0);
      const texto = dialogo[i];
      const duracionTypewriter = Math.min(900, tiempoPorLinea * 600);
      const paso = Math.max(8, duracionTypewriter / Math.max(texto.length, 1));
      const tick = window.setInterval(() => {
        setChars((c) => {
          const next = c + 1;
          if (next >= texto.length) {
            window.clearInterval(tick);
            window.setTimeout(() => {
              if (cancelado) return;
              const siguiente = i + 1;
              if (siguiente < dialogo.length) {
                mostrarLinea(siguiente);
              } else {
                setLineaActual(dialogo.length); // marca "completo"
              }
            }, Math.max(200, tiempoPorLinea * 400));
          }
          return Math.min(next, texto.length);
        });
      }, paso);
    }

    window.setTimeout(() => mostrarLinea(0), 200);
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogo, mostrarCompleto]);

  if (mostrarCompleto) {
    return (
      <div className="card stack" role="region" aria-label="Diálogo completo">
        <strong>Diálogo completo</strong>
        {dialogo.map((l, i) => (
          <p key={i} style={{ fontSize: 'var(--fs-lg)', fontWeight: 600 }}>
            {l}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="card stack" role="region" aria-label="Diálogo con efecto de escritura">
      <strong>Diálogo</strong>
      {dialogo.map((linea, i) => {
        if (i > lineaActual) return null;
        const completo = i < lineaActual;
        const texto = completo ? linea : linea.slice(0, chars);
        return (
          <p
            key={i}
            style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, lineHeight: 1.4 }}
            aria-live={i === lineaActual ? 'polite' : 'off'}
          >
            {texto}
            {!completo && i === lineaActual && <span className="tw-cursor" aria-hidden="true" />}
          </p>
        );
      })}
    </div>
  );
}