import React from 'react';
import Icons from './Icons';

/* ─── Category config ─────────────────────────────────────────────── */
const CATEGORY = {
  trigger: { stripe: 'node-trigger', iconBg: 'bg-primary/15 text-primary', icon: Icons.Lightning, label: 'Trigger' },
  move: { stripe: 'node-mouse', iconBg: 'bg-secondary/15 text-secondary', icon: Icons.Mouse, label: 'Ratón' },
  click: { stripe: 'node-mouse', iconBg: 'bg-secondary/15 text-secondary', icon: Icons.Mouse, label: 'Ratón' },
  scroll: { stripe: 'node-mouse', iconBg: 'bg-secondary/15 text-secondary', icon: Icons.Mouse, label: 'Ratón' },
  key_press: { stripe: 'node-keyboard', iconBg: 'bg-accent/15 text-accent', icon: Icons.Keyboard, label: 'Teclado' },
  key_release: { stripe: 'node-keyboard', iconBg: 'bg-accent/15 text-accent', icon: Icons.Keyboard, label: 'Teclado' },
  write_text: { stripe: 'node-keyboard', iconBg: 'bg-accent/15 text-accent', icon: Icons.DocumentText, label: 'Texto' },
  loop_start: { stripe: 'node-loop', iconBg: 'bg-amber-500/15 text-amber-400', icon: Icons.Loop, label: 'Bucle' },
  loop_end: { stripe: 'node-loop', iconBg: 'bg-amber-500/15 text-amber-400', icon: Icons.Loop, label: 'Bucle' },
  conditional: { stripe: 'node-condition', iconBg: 'bg-success/15 text-success', icon: Icons.Condition, label: 'Lógica' },
};

const getCategory = (step, idx) => idx === 0 ? CATEGORY.trigger : (CATEGORY[step.type] ?? CATEGORY.trigger);

/* ─── Summary text per step type ─────────────────────────────────── */
function StepSummary({ step, idx }) {
  if (idx === 0) {
    const m = step.trigger_mode;
    return (
      <span className="text-text-muted">
        {m === 'manual' ? 'Solo manual desde la app'
          : m === 'hotkey' ? <><span className="kbd-chip">{step.trigger_hotkey || 'Sin asignar'}</span></>
            : m === 'interval' ? `Cada ${step.trigger_interval}s`
              : `Programado: ${step.trigger_hour}`}
      </span>
    );
  }
  if (step.type === 'move') return <span className="text-text-muted mono text-[10px]">X:{step.x} Y:{step.y}</span>;
  if (step.type === 'click') return <span className="text-text-muted mono text-[10px]">{step.button} · {step.pressed ? 'presionar' : 'soltar'} · ({step.x},{step.y})</span>;
  if (step.type === 'scroll') return <span className="text-text-muted mono text-[10px]">dx:{step.dx} dy:{step.dy} @ ({step.x},{step.y})</span>;
  if (step.type === 'key_press' || step.type === 'key_release') return <span className="kbd-chip">{step.key}</span>;
  if (step.type === 'write_text') return <span className="text-text-muted">&quot;{(step.text || '').slice(0, 42)}{(step.text || '').length > 42 ? '…' : ''}&quot;</span>;
  if (step.type === 'loop_start') return <span className="text-text-muted">{parseInt(step.loop_count) <= 0 ? <span className="text-amber-400 font-medium">∞ infinito</span> : `${step.loop_count} iteraciones`}</span>;
  if (step.type === 'loop_end') return <span className="text-text-muted">Cierra bloque de repetición</span>;
  if (step.type === 'conditional') return <span className="text-text-muted mono text-[10px]">mouse_{step.cond_type === 'mouse_x' ? 'x' : 'y'} &gt; {step.cond_val}px</span>;
  return null;
}

/* ─── Field Group ─────────────────────────────────────────────────── */
function FieldGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="section-label">{label}</label>
      {children}
    </div>
  );
}

/* ─── Expanded Config Panel ───────────────────────────────────────── */
function ConfigPanel({ step, idx, onUpdateStep, capturingKeyIndex, setCapturingKeyIndex, capturingTriggerIndex, setCapturingTriggerIndex, countdownStepIndex, onStartMouseCapture, countdownSeconds }) {
  const isTrigger = idx === 0;

  return (
    <div
      className="mt-2 mx-3 mb-3 bg-app-bg rounded-lg border border-app-border p-3 grid grid-cols-2 gap-3 animate-slideDown"
      onClick={e => e.stopPropagation()}
    >
      {/* Trigger Configuration */}
      {isTrigger && (
        <>
          <FieldGroup label="Modo">
            <select className="field-select" value={step.trigger_mode} onChange={e => onUpdateStep(0, { trigger_mode: e.target.value })}>
              <option value="manual">Manual (desde app)</option>
              <option value="hotkey">Atajo Global (Hotkey)</option>
              <option value="interval">Periódico (Intervalo)</option>
              <option value="schedule">Programado (Hora)</option>
            </select>
          </FieldGroup>

          {step.trigger_mode === 'hotkey' && (
            <FieldGroup label="Combinación de teclas">
              <div className="flex gap-1.5">
                <input
                  type="text" readOnly
                  value={step.trigger_hotkey}
                  placeholder="ej. ctrl+alt+a"
                  className="field-input mono flex-1 text-[11px]"
                />
                <button
                  className={`btn text-[10px] flex-shrink-0 ${capturingTriggerIndex === 0 ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setCapturingTriggerIndex(capturingTriggerIndex === 0 ? null : 0)}
                >
                  {capturingTriggerIndex === 0 ? '⏳ Pulsando…' : 'Asignar'}
                </button>
              </div>
            </FieldGroup>
          )}

          {step.trigger_mode === 'interval' && (
            <FieldGroup label="Ejecutar cada (segundos)">
              <input type="number" className="field-input" value={step.trigger_interval}
                onChange={e => onUpdateStep(0, { trigger_interval: parseInt(e.target.value) || 1 })} />
            </FieldGroup>
          )}

          {step.trigger_mode === 'schedule' && (
            <FieldGroup label="Hora de lanzamiento">
              <input type="time" className="field-input" value={step.trigger_hour}
                onChange={e => onUpdateStep(0, { trigger_hour: e.target.value })} />
            </FieldGroup>
          )}
        </>
      )}

      {/* Mouse capture */}
      {!isTrigger && (step.type === 'move' || step.type === 'click' || step.type === 'scroll') && (
        <div className="col-span-2 flex items-center justify-between gap-3 p-2.5 rounded-md bg-app-panel border border-app-border">
          <div>
            <div className="text-[11px] font-semibold text-text-primary">Capturar posición real</div>
            <div className="text-[10px] text-text-muted mt-0.5">Tendrás 3 seg para posicionar el cursor</div>
          </div>
          <button
            onClick={() => onStartMouseCapture(idx)}
            disabled={countdownStepIndex !== null}
            className="btn btn-primary flex-shrink-0 text-[10px]"
          >
            {countdownStepIndex === idx ? `⏱ ${countdownSeconds}s…` : '🎯 Capturar'}
          </button>
        </div>
      )}

      {/* XY coordinates */}
      {!isTrigger && (step.type === 'move' || step.type === 'click' || step.type === 'scroll') && (
        <>
          <FieldGroup label="X (píxeles)">
            <input type="number" className="field-input mono" value={step.x}
              onChange={e => onUpdateStep(idx, { x: parseInt(e.target.value) || 0 })} />
          </FieldGroup>
          <FieldGroup label="Y (píxeles)">
            <input type="number" className="field-input mono" value={step.y}
              onChange={e => onUpdateStep(idx, { y: parseInt(e.target.value) || 0 })} />
          </FieldGroup>
        </>
      )}

      {/* Click specifics */}
      {step.type === 'click' && (
        <>
          <FieldGroup label="Botón">
            <select className="field-select" value={step.button} onChange={e => onUpdateStep(idx, { button: e.target.value })}>
              <option value="left">Izquierdo</option>
              <option value="right">Derecho</option>
              <option value="middle">Central</option>
            </select>
          </FieldGroup>
          <FieldGroup label="Acción">
            <select className="field-select" value={step.pressed ? 'true' : 'false'} onChange={e => onUpdateStep(idx, { pressed: e.target.value === 'true' })}>
              <option value="true">Presionar</option>
              <option value="false">Soltar</option>
            </select>
          </FieldGroup>
        </>
      )}

      {/* Scroll */}
      {step.type === 'scroll' && (
        <>
          <FieldGroup label="DX (horizontal)">
            <input type="number" className="field-input mono" value={step.dx}
              onChange={e => onUpdateStep(idx, { dx: parseInt(e.target.value) || 0 })} />
          </FieldGroup>
          <FieldGroup label="DY (vertical)">
            <input type="number" className="field-input mono" value={step.dy}
              onChange={e => onUpdateStep(idx, { dy: parseInt(e.target.value) || 0 })} />
          </FieldGroup>
        </>
      )}

      {/* Key capture */}
      {!isTrigger && (step.type === 'key_press' || step.type === 'key_release') && (
        <div className="col-span-2">
          <FieldGroup label="Tecla física">
            <div className="flex gap-1.5">
              <input type="text" readOnly value={step.key} className="field-input mono flex-1 text-[11px]" />
              <button
                className={`btn flex-shrink-0 text-[10px] ${capturingKeyIndex === idx ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setCapturingKeyIndex(capturingKeyIndex === idx ? null : idx)}
              >
                {capturingKeyIndex === idx ? '⏳ Capturando…' : 'Capturar'}
              </button>
            </div>
          </FieldGroup>
        </div>
      )}

      {/* Write text */}
      {step.type === 'write_text' && (
        <div className="col-span-2">
          <FieldGroup label="Texto a mecanografiar">
            <input type="text" className="field-input" value={step.text || ''}
              onChange={e => onUpdateStep(idx, { text: e.target.value })}
              placeholder="ej. Hola Mundo" />
          </FieldGroup>
        </div>
      )}

      {/* Loop start */}
      {step.type === 'loop_start' && (
        <div className="col-span-2">
          <FieldGroup label="Repeticiones (0 = infinito)">
            <input type="number" className="field-input mono" value={step.loop_count}
              onChange={e => onUpdateStep(idx, { loop_count: parseInt(e.target.value) || 0 })} />
          </FieldGroup>
          {parseInt(step.loop_count) <= 0 && (
            <p className="text-[10px] text-amber-400 mt-2 flex items-center gap-1.5">
              <Icons.Loop className="w-3 h-3 flex-shrink-0" />
              Bucle infinito — detener con <kbd className="kbd-chip">CTRL+ALT+S</kbd>
            </p>
          )}
        </div>
      )}

      {/* Conditional */}
      {step.type === 'conditional' && (
        <>
          <FieldGroup label="Condición">
            <select className="field-select" value={step.cond_type} onChange={e => onUpdateStep(idx, { cond_type: e.target.value })}>
              <option value="mouse_x">mouse_x mayor que</option>
              <option value="mouse_y">mouse_y mayor que</option>
            </select>
          </FieldGroup>
          <FieldGroup label="Valor (px)">
            <input type="number" className="field-input mono" value={step.cond_val}
              onChange={e => onUpdateStep(idx, { cond_val: parseInt(e.target.value) || 0 })} />
          </FieldGroup>
        </>
      )}

      {/* Delay (non-trigger) */}
      {!isTrigger && (
        <FieldGroup label="Espera previa (s)">
          <input type="number" step="0.05" min="0" className="field-input mono" value={step.delay}
            onChange={e => onUpdateStep(idx, { delay: parseFloat(e.target.value) || 0 })} />
        </FieldGroup>
      )}

      {/* Name / comment */}
      <FieldGroup label="Alias (opcional)">
        <input type="text" className="field-input" value={step.title || ''}
          onChange={e => onUpdateStep(idx, { title: e.target.value })}
          placeholder={isTrigger ? 'Trigger' : step.type.replace('_', ' ')} />
      </FieldGroup>

      {!isTrigger && (
        <div className="col-span-2">
          <FieldGroup label="Comentario">
            <input type="text" className="field-input" value={step.comment || ''}
              onChange={e => onUpdateStep(idx, { comment: e.target.value })}
              placeholder="ej. Clic en botón de confirmación" />
          </FieldGroup>
        </div>
      )}
    </div>
  );
}

/* ─── StepCard ────────────────────────────────────────────────────── */
export default function StepCard({
  step, idx, isExpanded,
  onToggleExpand, onUpdateStep, onRemove, onContextMenu,
  onDragStart, onDragOver, onDrop,
  capturingKeyIndex, setCapturingKeyIndex,
  capturingTriggerIndex, setCapturingTriggerIndex,
  countdownStepIndex, onStartMouseCapture, countdownSeconds,
}) {
  const isTrigger = idx === 0;
  const cat = getCategory(step, idx);
  const Icon = cat.icon;

  const typeLabel = isTrigger ? 'Desencadenador' : step.type.replace('_', ' ');
  const displayTitle = step.title || typeLabel;

  return (
    <div
      draggable={!isTrigger}
      onDragStart={e => onDragStart(e, idx)}
      onDragOver={e => onDragOver(e, idx)}
      onDrop={e => onDrop(e, idx)}
      className="relative animate-fadeIn group/card"
      onContextMenu={e => onContextMenu(e, idx)}
    >
      <div className={`flow-node ${cat.stripe} ${step.disabled ? 'disabled' : ''} ${isExpanded ? 'active' : ''}`}>
        {/* Card Header */}
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer select-none"
          onClick={() => onToggleExpand(idx)}
        >
          {/* Drag handle (hidden for trigger) */}
          {!isTrigger && (
            <div className="opacity-0 group-hover/card:opacity-100 cursor-grab active:cursor-grabbing text-text-muted transition-opacity flex-shrink-0">
              <Icons.DragHandle className="w-3 h-3" />
            </div>
          )}

          {/* Step number */}
          <span className="w-[18px] h-[18px] rounded flex items-center justify-center text-[9px] font-bold mono bg-app-bg border border-app-border text-text-muted flex-shrink-0">
            {idx + 1}
          </span>

          {/* Icon */}
          <span className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${cat.iconBg}`}>
            <Icon className="w-3.5 h-3.5" />
          </span>

          {/* Title + summary */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[12px] font-semibold text-text-primary truncate leading-tight">
                {displayTitle}
              </span>
              {step.title && step.title !== typeLabel && (
                <span className="text-[9px] text-text-muted border border-app-border px-1 py-0 rounded bg-app-bg mono">
                  {typeLabel}
                </span>
              )}
              {step.disabled && (
                <span className="text-[8px] font-bold uppercase tracking-wider text-text-muted border border-app-border px-1.5 py-0 rounded bg-app-bg">
                  desactivado
                </span>
              )}
              {step.type === 'loop_start' && parseInt(step.loop_count) <= 0 && (
                <span className="text-[8px] font-bold mono text-amber-400 border border-amber-400/30 bg-amber-400/10 px-1.5 py-0 rounded">
                  ∞
                </span>
              )}
            </div>
            <div className="text-[10px] mt-0.5 leading-tight flex items-center gap-1">
              <StepSummary step={step} idx={idx} />
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-auto" onClick={e => e.stopPropagation()}>
            {!isTrigger && (
              <span className="text-[9px] mono text-text-muted opacity-0 group-hover/card:opacity-100 transition-opacity">{step.delay}s</span>
            )}
            <button
              onClick={() => onToggleExpand(idx)}
              className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold transition-colors ${isExpanded ? 'bg-primary/15 text-primary' : 'text-text-muted hover:text-text-secondary hover:bg-app-bg'
                }`}
              aria-label="Configurar paso"
            >
              <Icons.Gear className="w-3 h-3" />
            </button>
            {!isTrigger && (
              <button
                onClick={() => onRemove(idx)}
                className="w-6 h-6 rounded flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-colors opacity-0 group-hover/card:opacity-100"
                aria-label="Eliminar paso"
              >
                <Icons.Trash className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Comment badge */}
        {step.comment && !isExpanded && (
          <div className="px-3 pb-2 -mt-1">
            <span className="text-[9px] text-text-muted italic flex items-center gap-1">
              <Icons.DocumentText className="w-2.5 h-2.5 flex-shrink-0" />
              {step.comment}
            </span>
          </div>
        )}

        {/* Expanded config */}
        {isExpanded && (
          <ConfigPanel
            step={step} idx={idx}
            onUpdateStep={onUpdateStep}
            capturingKeyIndex={capturingKeyIndex}
            setCapturingKeyIndex={setCapturingKeyIndex}
            capturingTriggerIndex={capturingTriggerIndex}
            setCapturingTriggerIndex={setCapturingTriggerIndex}
            countdownStepIndex={countdownStepIndex}
            onStartMouseCapture={onStartMouseCapture}
            countdownSeconds={countdownSeconds}
          />
        )}
      </div>
    </div>
  );
}