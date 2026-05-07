import React from 'react';
import Icons from './Icons';

function StatCard({ value, label, color = 'text-primary' }) {
  return (
    <div className="bg-app-bg border border-app-border rounded-lg p-4 text-center">
      <div className={`text-3xl font-bold mono tracking-tight ${color}`}>{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-text-muted mt-1 font-semibold">{label}</div>
    </div>
  );
}

export default function DashboardView({ macros, status, onPlayMacro, onStopMacro, onEditMacro }) {
  const activeTriggersCount = macros.filter(m => m.trigger_key).length;

  return (
    <div className="space-y-4 animate-fadeIn">

      {/* Top row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Welcome panel */}
        <div className="lg:col-span-2 bg-app-panel border border-app-border rounded-lg p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icons.Lightning className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-text-primary">TriggerKey Studio</h3>
              <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed max-w-lg">
                Automatización física de teclado y ratón. Diseña flujos secuenciales, configura disparadores globales, bucles infinitos y condicionales desde el constructor visual.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatCard value={macros.length} label="Flujos guardados" />
            <StatCard value={activeTriggersCount} label="Atajos activos" color="text-secondary" />
            <StatCard value={macros.reduce((a, m) => a + (m.steps_count || 0), 0)} label="Acciones totales" color="text-accent" />
          </div>
        </div>

        {/* Emergency Stop */}
        <div className="bg-app-panel border border-app-border border-t-2 border-t-danger rounded-lg p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-danger/10 flex items-center justify-center flex-shrink-0">
              <Icons.Stop className="w-3.5 h-3.5 text-danger" />
            </div>
            <span className="text-[12px] font-semibold text-text-primary">Parada de Emergencia</span>
          </div>

          <p className="text-[11px] text-text-muted leading-relaxed mb-3 flex-1">
            Si un bucle pierde el control, pulsa la combinación de interrupción global:
          </p>

          <div className="bg-danger/8 border border-danger/20 rounded-md py-2 px-3 text-center mono font-bold text-[12px] text-danger tracking-widest mb-4">
            CTRL + ALT + S
          </div>

          <button
            onClick={() => onEditMacro(null)}
            className="btn btn-primary w-full text-[11px]"
          >
            <Icons.Plus className="w-3.5 h-3.5" />
            Nuevo Flujo
          </button>
        </div>
      </div>

      {/* Saved macros quick-play */}
      <div className="bg-app-panel border border-app-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-app-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.Play className="w-3.5 h-3.5 text-success" />
            <span className="text-[12px] font-semibold text-text-primary">Ejecución rápida</span>
          </div>
          <span className="text-[10px] text-text-muted">{macros.length} flujo{macros.length !== 1 ? 's' : ''}</span>
        </div>

        {macros.length === 0 ? (
          <div className="py-10 text-center">
            <Icons.Folder className="w-8 h-8 text-app-border mx-auto mb-2" />
            <p className="text-[11px] text-text-muted">Sin flujos guardados. Crea uno desde el Constructor.</p>
          </div>
        ) : (
          <div className="divide-y divide-app-border">
            {macros.map((macro, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-app-bg transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icons.Folder className="w-3 h-3 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-medium text-text-primary truncate">{macro.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-text-muted">{macro.steps_count} acciones</span>
                      {macro.trigger_key && (
                        <span className="kbd-chip">{macro.trigger_key}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onEditMacro(macro.name)}
                    className="btn btn-ghost py-1 px-2 text-[10px]"
                    aria-label={`Editar ${macro.name}`}
                  >
                    <Icons.ArrowsExpand className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onPlayMacro(macro.name)}
                    disabled={status.playing || status.recording}
                    className="btn btn-success py-1 px-2.5 text-[10px]"
                    aria-label={`Ejecutar ${macro.name}`}
                  >
                    <Icons.Play className="w-3 h-3" />
                    Run
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}