'use client';

// Wrapper interno del layout raíz: nav, contenido, pie y nota de honestidad.
// El layout raíz es server component mínimo; este wrapper es client para poder usar
// contexto, efectos y localStorage.

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import Nav from './Nav';
import HonestyNote from './HonestyNote';
import { VideoProvider } from './VideoContext';

export default function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <VideoProvider>
      <a className="sr-only" href="#contenido">
        Saltar al contenido
      </a>
      <Nav />
      <main id="contenido" className="container" style={{ paddingBlock: 'var(--sp-5)' }}>
        {children}
      </main>
      <footer
        className="container"
        style={{
          paddingBlock: 'var(--sp-4)',
          color: 'var(--text-muted)',
          fontSize: 'var(--fs-sm)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--sp-3)',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border)',
        }}
      >
        <span>🐾 Que Dice Mi Mascota · un juego sin IA real</span>
        <span>
          Estás en <code style={{ fontFamily: 'inherit' }}>{pathname || '/'}</code> ·{' '}
          <a href="/matriz">Matriz de prueba</a>
        </span>
      </footer>
      <HonestyNote />
    </VideoProvider>
  );
}