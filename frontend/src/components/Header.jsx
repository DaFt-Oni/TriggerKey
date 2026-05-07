import React from 'react';
import Icons from './Icons';

const TAB_META = {
  dashboard: { title: 'Panel Principal', sub: 'Resumen de automatizaciones' },
  builder: { title: 'Constructor de Macros', sub: 'Editor visual de flujos' },
  library: { title: 'Mis Flujos', sub: 'Gestión de automatizaciones guardadas' },
  docs: { title: 'Documentación', sub: 'Guía de teclas, bucles y disparadores' },
};

export default function Header({ activeTab, status, onOpenRecording, onStopRecording, onStopAll }) {
  const meta = TAB_META[activeTab] ?? { title: 'TriggerKey', sub: '' };

  return (
    <header className="h-12 px-5 flex items-center justify-between border-b border-app-border bg-app-panel/50 flex-shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-semibold text-text-primary">{meta.title}</span>
        <span className="text-text-muted text-[13px]">/</span>
        <span className="text-[11px] text-text-muted">{meta.sub}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {(status.recording || status.playing) && (
          <button
            onClick={onStopAll}
            className="btn btn-ghost text-danger border-danger/30 hover:bg-danger/10 text-[11px]"
            aria-label="Detener todas las operaciones"
          >
            <Icons.Stop className="w-3.5 h-3.5" />
            Parar Todo
          </button>
        )}

        {status.recording ? (
          <button
            onClick={onStopRecording}
            className="btn btn-danger text-[11px] animate-pulse"
            aria-label="Detener grabación"
          >
            <span className="w-2 h-2 rounded-full bg-white/70 animate-ping absolute" />
            <Icons.Stop className="w-3.5 h-3.5" />
            Detener Grabación
          </button>
        ) : (
          <button
            onClick={onOpenRecording}
            className="btn btn-primary text-[11px]"
            aria-label="Iniciar grabación"
          >
            <span className="w-2 h-2 rounded-full bg-white/70" />
            Grabar Atajo
          </button>
        )}
      </div>
    </header>
  );
}