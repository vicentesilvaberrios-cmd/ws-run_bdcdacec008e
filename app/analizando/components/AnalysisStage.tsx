'use client';

// Una etapa individual de la animación con texto descriptivo y spinner.

export interface AnalysisStageProps {
  texto: string;
  estado: 'pending' | 'active' | 'done';
  detalle?: string;
}

export default function AnalysisStage({ texto, estado, detalle }: AnalysisStageProps) {
  return (
    <li className={`stage-item ${estado === 'done' ? 'is-done' : ''} ${estado === 'active' ? 'is-active' : ''} ${estado === 'pending' ? 'is-pending' : ''}`}>
      <span className="spinner" aria-hidden="true" />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{texto}</div>
        {detalle && <div className="muted text-sm">{detalle}</div>}
      </div>
      <span className="sr-only">
        {estado === 'done' ? 'completado' : estado === 'active' ? 'en curso' : 'pendiente'}
      </span>
    </li>
  );
}