import React, { useState } from 'react';
import Icons from './Icons';

const TEMPLATES = [
  {
    name: 'Autoclicker Rápido',
    desc: 'Clic continuo e infinito. Ideal para juegos o formularios repetitivos.',
    steps_count: 4,
    trigger_key: 'ctrl+alt+c',
    steps: [
      { type: 'trigger', trigger_mode: 'hotkey', trigger_hotkey: 'ctrl+alt+c', delay: 0.0, disabled: false },
      { type: 'loop_start', loop_count: 0, delay: 0.05, disabled: false },
      { type: 'click', button: 'left', pressed: true, x: 500, y: 500, delay: 0.05, disabled: false },
      { type: 'loop_end', delay: 0.0, disabled: false },
    ],
  },
  {
    name: 'Firma de Texto',
    desc: 'Inserta bloques de texto en cualquier campo activo al instante.',
    steps_count: 2,
    trigger_key: 'ctrl+alt+f',
    steps: [
      { type: 'trigger', trigger_mode: 'hotkey', trigger_hotkey: 'ctrl+alt+f', delay: 0.0, disabled: false },
      { type: 'write_text', text: 'Saludos cordiales,\nTriggerKey Automatizaciones', delay: 0.1, disabled: false },
    ],
  },
  {
    name: 'Auto-scroll',
    desc: 'Desplazamiento continuo de página para lectura o monitoreo.',
    steps_count: 4,
    trigger_key: 'ctrl+alt+s',
    steps: [
      { type: 'trigger', trigger_mode: 'hotkey', trigger_hotkey: 'ctrl+alt+s', delay: 0.0, disabled: false },
      { type: 'loop_start', loop_count: 50, delay: 0.1, disabled: false },
      { type: 'scroll', dx: 0, dy: -5, x: 500, y: 500, delay: 0.2, disabled: false },
      { type: 'loop_end', delay: 0.0, disabled: false },
    ],
  },
];

export default function LibraryView({ macros, status, onPlayMacro, onEditMacro, onDeleteMacro, onCreateMacro, onLoadTemplateSteps }) {
  const [query, setQuery] = useState('');
  const filtered = macros.filter(m => m.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-4 animate-fadeIn">

      {/* Saved flows */}
      <div className="bg-app-panel border border-app-border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-app-border flex items-center gap-3">
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-text-primary">Biblioteca de Flujos</div>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Icons.Folder className="w-3.5 h-3.5 text-text-muted absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="field-input pl-7 w-40 py-1.5 text-[11px]"
                aria-label="Buscar flujos"
              />
            </div>
            <button onClick={onCreateMacro} className="btn btn-primary text-[11px]">
              <Icons.Plus className="w-3.5 h-3.5" />
              Nuevo
            </button>
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Icons.Folder className="w-8 h-8 text-app-border mx-auto mb-3" />
            <p className="text-[11px] text-text-muted font-medium">
              {query ? 'Sin resultados' : 'Sin flujos guardados'}
            </p>
            {!query && (
              <p className="text-[10px] text-text-muted mt-1">
                Carga una plantilla de abajo para empezar rápido.
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-app-border max-h-72 overflow-y-auto">
            {filtered.map((macro, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-app-bg transition-colors group"
              >
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icons.Folder className="w-3.5 h-3.5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-text-primary truncate">{macro.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-text-muted">{macro.steps_count} acciones</span>
                    {macro.trigger_key && (
                      <span className="kbd-chip flex items-center gap-1">
                        <Icons.Lightning className="w-2.5 h-2.5 text-secondary" />
                        {macro.trigger_key}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onPlayMacro(macro.name)}
                    disabled={status.playing || status.recording}
                    className="btn btn-success py-1 px-2.5 text-[10px]"
                    aria-label={`Ejecutar ${macro.name}`}
                  >
                    <Icons.Play className="w-3 h-3" /> Ejecutar
                  </button>
                  <button
                    onClick={() => onEditMacro(macro.name)}
                    className="btn btn-ghost py-1 px-2 text-[10px]"
                    aria-label={`Editar ${macro.name}`}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => { if (confirm(`¿Eliminar "${macro.name}"?`)) onDeleteMacro(macro.name); }}
                    className="btn py-1 px-2 text-[10px] text-text-muted hover:text-danger hover:bg-danger/8 border border-app-border rounded-md"
                    aria-label={`Eliminar ${macro.name}`}
                  >
                    <Icons.Trash className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Templates */}
      <div className="bg-app-panel border border-app-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-app-border">
          <div className="text-[13px] font-semibold text-text-primary">Plantillas de inicio rápido</div>
          <div className="text-[10px] text-text-muted mt-0.5">Importa una plantilla preconfigurada al constructor.</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-app-border">
          {TEMPLATES.map((tpl, i) => (
            <div key={i} className="p-4 flex flex-col gap-3 hover:bg-app-bg transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="text-[12px] font-semibold text-text-primary leading-snug">{tpl.name}</div>
                <span className="kbd-chip flex-shrink-0 text-[9px]">{tpl.trigger_key}</span>
              </div>
              <p className="text-[10px] text-text-muted leading-relaxed flex-1">{tpl.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-text-muted">{tpl.steps_count} pasos</span>
                <button
                  onClick={() => onLoadTemplateSteps(tpl)}
                  className="btn btn-ghost text-[10px] py-1 px-2.5"
                >
                  Cargar →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}