'use client';

// Barra de navegación (Inicio / Mis traducciones).
// Atajos globales: R (otro guion) y N (traducir otro video). No se activan si el foco
// está en un input/textarea o si hay un menú nativo abierto.

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useVideo } from './VideoContext';

function esEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { reset, registroActual } = useVideo();

  // Atajos globales: R → regenerar diálogo en /resultado; N → volver a / y limpiar.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (esEditable(e.target)) return;
      if (e.key === 'r' || e.key === 'R') {
        if (pathname !== '/resultado') return;
        // Empuja hacia arriba para que /resultado reescriba el guion (regenera la versión).
        // Se hace mediante un CustomEvent que Resultado escucha.
        if (registroActual) {
          window.dispatchEvent(new CustomEvent('app:regenerarGuion'));
        }
      } else if (e.key === 'n' || e.key === 'N') {
        // Volver a inicio y limpiar el contexto.
        if (pathname === '/') return;
        reset();
        router.push('/');
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pathname, router, reset, registroActual]);

  const esInicio = pathname === '/';
  const esHistorial = pathname?.startsWith('/historial');
  const esResultado = pathname === '/resultado';

  return (
    <header className="navbar">
      <a
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-2)',
          color: 'inherit',
          textDecoration: 'none',
          fontWeight: 700,
        }}
        aria-label="Inicio · Que Dice Mi Mascota"
      >
        <span aria-hidden="true" style={{ fontSize: '1.4rem' }}>🐾</span>
        <span>Que Dice Mi Mascota</span>
        {esResultado && (
          <span className="muted text-sm" style={{ marginLeft: 'var(--sp-2)' }}>
            Atajos: <kbd>R</kbd> otro guion · <kbd>N</kbd> nuevo video
          </span>
        )}
      </a>
      <nav aria-label="Principal">
        <a
          href="/"
          aria-current={esInicio ? 'page' : undefined}
          style={esInicio ? { fontWeight: 700, textDecoration: 'underline' } : undefined}
        >
          Inicio
        </a>
        <a
          href="/historial"
          aria-current={esHistorial ? 'page' : undefined}
          style={esHistorial ? { fontWeight: 700, textDecoration: 'underline' } : undefined}
        >
          Mis traducciones
        </a>
      </nav>
    </header>
  );
}