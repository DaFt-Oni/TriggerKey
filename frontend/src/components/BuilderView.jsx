import React from 'react';
import Icons from './Icons';
import StepCard from './StepCard';

/* ─── Palette item definitions ────────────────────────────────────── */
const PALETTE = [
  {
    category: 'Ratón',
    color: 'text-secondary',
    items: [
      { type: 'move', label: 'Mover', icon: Icons.Mouse },
      { type: 'click', label: 'Clic', icon: Icons.Mouse },
      { type: 'scroll', label: 'Scroll', icon: Icons.Mouse },
    ],
  },
  {
    category: 'Teclado',
    color: 'text-accent',
    items: [
      { type: 'key_press', label: 'Pulsar Tecla', icon: Icons.Keyboard },
      { type: 'key_release', label: 'Soltar Tecla', icon: Icons.Keyboard },
      { type: 'write_text', label: 'Escribir Texto', icon: Icons.DocumentText },
    ],
  },
  {
    category: 'Bucles',
    color: 'text-amber-400',
    items: [
      { type: 'loop_start', label: 'Inicio Bucle', icon: Icons.Loop },
      { type: 'loop_end', label: 'Fin Bucle', icon: Icons.Loop },
    ],
  },
  {
    category: 'Lógica',
    color: 'text-success',
    items: [
      { type: 'conditional', label: 'Condición (If)', icon: Icons.Condition },
    ],
  },
];

/* ─── Palette button ──────────────────────────────────────────────── */
function PaletteBtn({ item, onAdd, onContextMenu }) {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onAdd(item.type)}
      onContextMenu={e => { e.preventDefault(); onContextMenu(e, item.type); }}
      className="group flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-[11px] font-medium text-text-secondary hover:text-text-primary hover:bg-app-bg transition-colors text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
      title={`Añadir ${item.label} (clic derecho para detalles)`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      <Icons.Plus className="w-3 h-3 opacity-0 group-hover:opacity-70 flex-shrink-0" />
    </button>
  );
}

/* ─── Insert button between steps ────────────────────────────────── */
function InsertPoint({ idx, onAddStep }) {
  return (
    <div className="group/insert relative flex items-center justify-center h-6 my-1">
      {/* Connector line */}
      <div className="absolute left-[18px] right-0 top-1/2 -translate-y-1/2 h-px bg-app-border transition-colors group-hover/insert:bg-primary/30" />
      {/* Insert actions */}
      <div className="relative z-10 opacity-0 group-hover/insert:opacity-100 transition-all duration-150 bg-app-panel border border-app-border rounded-full flex items-center gap-0.5 px-1.5 py-0.5 shadow-sm">
        {[
          { type: 'click', label: 'Clic', color: 'hover:text-secondary' },
          { type: 'write_text', label: 'Texto', color: 'hover:text-accent' },
          { type: 'loop_start', label: 'Bucle', color: 'hover:text-amber-400' },
        ].map(a => (
          <button
            key={a.type}
            onClick={e => { e.stopPropagation(); onAddStep(a.type, idx); }}
            className={`text-[9px] font-bold text-text-muted ${a.color} px-1.5 py-0.5 rounded transition-colors`}
          >
            + {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── BuilderView ─────────────────────────────────────────────────── */
export default function BuilderView({
  builderName, setBuilderName,
  builderSteps, onAddStep, onRemoveStep, onUpdateStep,
  onClearBuilder, onPlaySteps, onSaveMacro,
  onToggleExpand, expandedIndex,
  onStepContextMenu, onDragStart, onDragOver, onDrop,
  capturingKeyIndex, setCapturingKeyIndex,
  capturingTriggerIndex, setCapturingTriggerIndex,
  countdownStepIndex, onStartMouseCapture, countdownSeconds,
  status, onOpenHelp, onPaletteContextMenu,
}) {
  const activeSteps = builderSteps.filter(s => !s.disabled).length;
  const totalDelay = builderSteps.reduce((a, s) => a + (s.delay || 0), 0).toFixed(2);

  return (
    <div className="flex gap-4 animate-fadeIn h-full" style={{ minHeight: '560px' }}>

      {/* ── LEFT: Action Palette ─────────────────────────────────── */}
      <aside className="w-[200px] flex-shrink-0 flex flex-col bg-app-panel border border-app-border rounded-lg overflow-hidden">
        <div className="px-3 py-2.5 border-b border-app-border">
          <div className="text-[10px] font-bold tracking-widest text-text-muted uppercase">Paleta de Acciones</div>
          <div className="text-[9px] text-text-muted mt-0.5">Clic para añadir · Clic derecho para info</div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {PALETTE.map(group => (
            <div key={group.category}>
              <div className={`section-label mb-1 ${group.color}`}>{group.category}</div>
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <PaletteBtn
                    key={item.type}
                    item={item}
                    onAdd={onAddStep}
                    onContextMenu={onPaletteContextMenu}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Stats + actions */}
        <div className="border-t border-app-border p-3 space-y-2">
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="bg-app-bg rounded border border-app-border px-2 py-1.5 text-center">
              <div className="font-bold text-primary mono">{builderSteps.length}</div>
              <div className="text-text-muted text-[8.5px] uppercase tracking-wide mt-0.5">Pasos</div>
            </div>
            <div className="bg-app-bg rounded border border-app-border px-2 py-1.5 text-center">
              <div className="font-bold text-secondary mono">{totalDelay}s</div>
              <div className="text-text-muted text-[8.5px] uppercase tracking-wide mt-0.5">Espera</div>
            </div>
          </div>

          <button
            onClick={onPlaySteps}
            disabled={builderSteps.length <= 1 || status.playing}
            className="btn btn-success w-full text-[11px] py-2"
          >
            <Icons.Play className="w-3.5 h-3.5" />
            Probar flujo
          </button>

          <button
            onClick={onClearBuilder}
            className="btn btn-ghost w-full text-[11px] text-text-muted"
          >
            Vaciar
          </button>
        </div>
      </aside>

      {/* ── RIGHT: Flow Canvas ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-app-panel border border-app-border rounded-lg overflow-hidden">

        {/* Canvas header */}
        <div className="px-4 py-2.5 border-b border-app-border flex items-center gap-3">
          <input
            type="text"
            placeholder="Nombre del flujo…"
            value={builderName}
            onChange={e => setBuilderName(e.target.value)}
            className="flex-1 bg-transparent border-none p-0 text-[14px] font-bold text-text-primary placeholder-text-muted focus:outline-none"
            aria-label="Nombre del flujo de automatización"
          />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {activeSteps < builderSteps.length && (
              <span className="text-[10px] text-text-muted border border-app-border px-2 py-0.5 rounded bg-app-bg">
                {builderSteps.length - activeSteps} desactivado{builderSteps.length - activeSteps > 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={onOpenHelp}
              className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-text-secondary hover:bg-app-bg transition-colors"
              aria-label="Ver instructivo"
              title="Instructivo"
            >
              <Icons.HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Flow steps */}
        <div className="flex-1 overflow-y-auto p-4 relative">
          {/* Background dot-grid for visual context */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{
              backgroundImage: 'radial-gradient(circle, hsl(218,14%,60%) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          {/* Flow container */}
          <div className="relative max-w-xl mx-auto space-y-0">
            {/* Vertical connector line */}
            <div
              className="absolute left-[22px] top-5 w-px bg-app-border"
              style={{ height: `calc(100% - 28px)` }}
              aria-hidden="true"
            />

            {builderSteps.map((step, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <InsertPoint idx={idx} onAddStep={onAddStep} />}

                <div className="relative pl-8">
                  {/* Connector dot on the vertical line */}
                  <div className="absolute left-[18px] top-[17px] w-[9px] h-[9px] rounded-full bg-app-panel border-2 border-app-border z-10" aria-hidden="true" />

                  <StepCard
                    step={step}
                    idx={idx}
                    isExpanded={expandedIndex === idx}
                    onToggleExpand={onToggleExpand}
                    onUpdateStep={onUpdateStep}
                    onRemove={onRemoveStep}
                    onContextMenu={onStepContextMenu}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    capturingKeyIndex={capturingKeyIndex}
                    setCapturingKeyIndex={setCapturingKeyIndex}
                    capturingTriggerIndex={capturingTriggerIndex}
                    setCapturingTriggerIndex={setCapturingTriggerIndex}
                    countdownStepIndex={countdownStepIndex}
                    onStartMouseCapture={onStartMouseCapture}
                    countdownSeconds={countdownSeconds}
                  />
                </div>
              </React.Fragment>
            ))}

            {/* Add first step hint */}
            {builderSteps.length === 1 && (
              <div className="relative pl-8 mt-2">
                <div className="absolute left-[18px] top-[17px] w-[9px] h-[9px] rounded-full bg-app-panel border-2 border-app-border/50 border-dashed z-10" />
                <div className="border border-dashed border-app-border rounded-lg p-4 text-center">
                  <p className="text-[11px] text-text-muted">
                    Añade acciones desde la paleta izquierda
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Canvas footer */}
        <div className="px-4 py-3 border-t border-app-border flex items-center justify-between">
          <div className="text-[10px] text-text-muted">
            {builderSteps.length} paso{builderSteps.length !== 1 ? 's' : ''} · {totalDelay}s de espera total
          </div>
          <button
            onClick={onSaveMacro}
            className="btn btn-primary text-[11px]"
          >
            <Icons.Check className="w-3.5 h-3.5" />
            Guardar Flujo
          </button>
        </div>
      </div>

    </div>
  );
}