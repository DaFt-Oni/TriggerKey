import React from 'react';
import Icons from './Icons';

const tabs = [
  { id: 'dashboard', label: 'Panel', icon: 'Dashboard' },
  { id: 'builder', label: 'Constructor', icon: 'Lightning' },
  { id: 'library', label: 'Mis Flujos', icon: 'Folder' },
  { id: 'docs', label: 'Documentación', icon: 'DocumentText' },
];

export default function Sidebar({ activeTab, setActiveTab, status, onStopAll, theme, onToggleTheme }) {
  const isActive = status.recording || status.playing;

  return (
    <aside
      className="w-[210px] flex flex-col h-full bg-app-panel border-r border-app-border flex-shrink-0"
      aria-label="Navegación principal"
    >
      {/* Brand */}
      <div className="px-4 py-4 border-b border-app-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shadow-sm shadow-primary/30 flex-shrink-0">
            <Icons.Lightning className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-[13px] font-bold tracking-tight text-text-primary leading-none">TriggerKey</div>
            <div className="text-[9px] font-semibold text-text-muted mt-0.5 mono tracking-widest">PRO v1.1</div>
          </div>
        </div>
        <button
          onClick={onToggleTheme}
          className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-text-secondary hover:bg-app-bg transition-colors"
          aria-label={theme === 'theme-light' ? 'Modo oscuro' : 'Modo claro'}
          title={theme === 'theme-light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
        >
          {theme === 'theme-light'
            ? <Icons.Moon className="w-3.5 h-3.5" />
            : <Icons.Sun className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5" role="tablist" aria-label="Secciones">
        {tabs.map(tab => {
          const Icon = Icons[tab.icon];
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${active
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'text-text-secondary hover:bg-app-bg hover:text-text-primary'
                }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Status Monitor */}
      <div className="p-3 border-t border-app-border space-y-2">
        <div className="flex items-center justify-between text-[10px] font-medium">
          <span className="text-text-muted">Estado</span>
          <div className="flex items-center gap-1.5">
            <span className={`status-dot ${status.recording ? 'recording' : status.playing ? 'active' : ''}`} />
            <span className={`font-semibold ${status.recording ? 'text-danger' : status.playing ? 'text-success' : 'text-text-muted'}`}>
              {status.recording ? 'Grabando' : status.playing ? 'Ejecutando' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded border text-[9px] mono font-semibold tracking-wider transition-colors ${status.recording
              ? 'bg-danger/10 border-danger/30 text-danger'
              : 'bg-app-bg border-app-border text-text-muted'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.recording ? 'bg-danger animate-pulse' : 'bg-app-border'}`} />
            REC
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded border text-[9px] mono font-semibold tracking-wider transition-colors ${status.playing
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-app-bg border-app-border text-text-muted'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.playing ? 'bg-success animate-pulse' : 'bg-app-border'}`} />
            PLAY
          </div>
        </div>

        {isActive && (
          <button
            onClick={onStopAll}
            className="btn btn-danger w-full text-[11px] py-2"
            aria-label="Detener todas las operaciones"
          >
            <Icons.Stop className="w-3.5 h-3.5" />
            Parar Todo
          </button>
        )}
      </div>
    </aside>
  );
}