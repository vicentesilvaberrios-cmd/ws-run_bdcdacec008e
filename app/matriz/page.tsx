'use client';

// Matriz de prueba (E10 / criterio 4): perro × 6 ánimos y gato × 6 ánimos.
// Cada celda expone las señales simuladas y la clasificación.
// Sirve para validar visualmente que ánimos distintos producen celdas distintas.

import { useMemo } from 'react';
import { emojiAnimo } from '../../src/lib/personajes';
import { obtenerMatriz } from '../../src/lib/matriz';
import type { Animo, Especie } from '../../src/lib/tipos';

const ANIMOS_PERRO: Animo[] = [
  'eufórico',
  'jugueton',
  'alerta',
  'curioso',
  'quejandose',
  'zen',
];

const ANIMOS_GATO: Animo[] = [
  'caceria',
  'caceria',
  'evaluandote',
  'conversador',
  'reclamando',
  'zen-absoluto',
];

function humano(a: string): string {
  const mapa: Record<string, string> = {
    'eufórico': 'eufórico',
    'jugueton': 'juguetón',
    'alerta': 'alerta',
    'curioso': 'curioso',
    'quejandose': 'quejándose',
    'zen': 'zen',
    'exigiendo': 'exigiendo',
    'caceria': 'de caza',
    'conversador': 'conversador',
    'evaluandote': 'evaluándote',
    'reclamando': 'reclamando',
    'zen-absoluto': 'zen absoluto',
  };
  return mapa[a] ?? a;
}

export default function Matriz() {
  const celdas = useMemo(() => obtenerMatriz(), []);

  const filasPorEspecie = (esp: Especie) => {
    return ANIMOS_PERRO.map((animo, i) => {
      const celda = celdas.find((c) => c.especie === esp && c.animo === animo);
      return { animo, animoGato: ANIMOS_GATO[i], celda };
    });
  };

  return (
    <div className="stack">
      <header>
        <h1>Matriz de prueba</h1>
        <p className="subtitle">
          Aquí puedes ver las 6 celdas por especie. Son señales simuladas que, pasadas por
          nuestro analizador, producen ánimos distintos. Esto demuestra que un video muy
          movido y uno casi estático dan ánimos diferentes.
        </p>
      </header>

      <p className="muted text-sm">
        Cada celda muestra las señales medidas (movimiento, ráfagas, brillo, contraste,
        zona, audio, duración) y el ánimo final con su certeza.
      </p>

      <div className="table-wrap">
        <table className="table" aria-label="Matriz de ánimos por especie">
          <thead>
            <tr>
              <th>Especie</th>
              <th>Ánimo 1</th>
              <th>Ánimo 2</th>
              <th>Ánimo 3</th>
              <th>Ánimo 4</th>
              <th>Ánimo 5</th>
              <th>Ánimo 6</th>
            </tr>
          </thead>
          <tbody>
            {(['perro', 'gato'] as Especie[]).map((esp) => (
              <tr key={esp}>
                <th scope="row" style={{ background: 'var(--surface-2)' }}>
                  {esp === 'perro' ? '🐶 Perro' : '🐱 Gato'}
                </th>
                {filasPorEspecie(esp).map((f, idx) =>
                  f.celda ? (
                    <td key={idx}>
                      <div style={{ fontWeight: 600 }}>
                        {emojiAnimo(f.celda.animo)} {humano(f.celda.animo)}
                      </div>
                      <div className="muted text-sm">
                        certeza {f.celda.clasificacion.certeza}%
                      </div>
                      <ul
                        className="text-sm"
                        style={{
                          listStyle: 'none',
                          padding: 0,
                          margin: 'var(--sp-2) 0 0',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <li>mov {(f.celda.senales.movimiento * 100).toFixed(0)}%</li>
                        <li>{f.celda.senales.rafagas} ráfagas</li>
                        <li>brillo {Math.round(f.celda.senales.brillo)}</li>
                        <li>audio {(f.celda.senales.audio * 100).toFixed(0)}%</li>
                      </ul>
                    </td>
                  ) : (
                    <td key={idx}>—</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel text-sm muted">
        <strong>Cómo leer la matriz</strong>
        <p style={{ marginTop: 'var(--sp-2)' }}>
          Las dos filas (perro y gato) son la misma idea base de "ánimo canónico" mapeada
          a la especie. Por ejemplo, "movimiento alto + audio alto" es eufórico en perro
          y de caza en gato. Las señales concretas son las que nuestro analizador lee del
          video; distintas señales ⇒ distintos ánimos.
        </p>
      </div>
    </div>
  );
}