'use client';

// Grilla del historial (E5): miniaturas + especie/ánimo + fecha + borrar individual.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import HistoryCard from './components/HistoryCard';
import { listarTraducciones, borrarTraduccion } from '../../src/lib/db';
import type { RegistroTraduccion } from '../../src/lib/tipos';

type FiltroEspecie = 'todas' | 'perro' | 'gato';

export default function Historial() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registros, setRegistros] = useState<RegistroTraduccion[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<FiltroEspecie>('todas');
  const [feedback, setFeedback] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const lista = await listarTraducciones();
      setRegistros(lista);
    } catch {
      setError('No pudimos leer el historial. Revisa que tu navegador permita almacenamiento local.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function borrar(id: string) {
    try {
      await borrarTraduccion(id);
      setRegistros((rs) => rs.filter((r) => r.id !== id));
      setFeedback('Traducción borrada');
      window.setTimeout(() => setFeedback(null), 3000);
    } catch {
      setError('No pudimos borrar. Inténtalo otra vez.');
    }
  }

  const filtrados = registros.filter((r) => {
    if (filtro !== 'todas' && r.especie !== filtro) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const match = r.dialogo.some((l) => l.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="stack">
      <header>
        <h1>Mis traducciones</h1>
        <p className="subtitle">
          Aquí están todas las que has hecho. Solo se guardan en tu navegador.
        </p>
      </header>

      {feedback && (
        <div className="badge badge-ok" role="status" aria-live="polite">
          {feedback}
        </div>
      )}

      <div className="toolbar" aria-label="Filtros del historial">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por palabra del diálogo…"
          aria-label="Buscar por palabra del diálogo"
          style={{ flex: '1 1 200px' }}
        />
        <label htmlFor="filtro-especie" className="sr-only">
          Filtrar por especie
        </label>
        <select
          id="filtro-especie"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as FiltroEspecie)}
          aria-label="Filtrar por especie"
          style={{ width: 'auto', minWidth: 140 }}
        >
          <option value="todas">Todas</option>
          <option value="perro">Perro</option>
          <option value="gato">Gato</option>
        </select>
      </div>

      {cargando && (
        <div className="muted" role="status" aria-live="polite">
          Cargando tus traducciones…
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
          <div style={{ marginTop: 'var(--sp-2)' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={cargar}>
              Reintentar
            </button>
          </div>
        </div>
      )}

      {!cargando && !error && filtrados.length === 0 && (
        <div className="empty-state">
          <p>
            {registros.length === 0
              ? 'Aún no has traducido ningún video.'
              : 'Ningún resultado con esos filtros.'}
          </p>
          {registros.length === 0 && (
            <Link href="/" className="btn btn-primary mt-4">
              Ir a Inicio
            </Link>
          )}
        </div>
      )}

      {!cargando && filtrados.length > 0 && (
        <div className="grid grid-sm-2 grid-md-3 grid-md-4" role="list" aria-label="Lista de traducciones">
          {filtrados.map((r) => (
            <div role="listitem" key={r.id}>
              <HistoryCard registro={r} onBorrar={borrar} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}