import React, { useEffect, useRef } from 'react';
import Icons from './Icons';

/* ─── useModalDismissal ───────────────────────────────────────────── */
function useModalDismissal(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);
}

/* ─── Backdrop ────────────────────────────────────────────────────── */
function Backdrop({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] animate-fadeIn p-4"
      role="dialog"
      aria-modal="true"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

/* ─── RecordingModal ─────────────────────────────────────────────── */
export function RecordingModal({ isOpen, onClose, name, setName, onStart }) {
  useModalDismissal(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <Backdrop onClose={onClose}>
      <div className="bg-app-panel border border-app-border rounded-xl shadow-2xl w-full max-w-md animate-fadeIn" aria-labelledby="rec-title">
        <div className="px-5 py-4 border-b border-app-border flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-danger animate-pulse shadow-[0_0_6px_hsl(0,84%,60%)]" />
          <h3 id="rec-title" className="text-[13px] font-semibold text-text-primary">Grabar flujo en tiempo real</h3>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-[11px] text-text-muted leading-relaxed">
            El sistema capturará todos los eventos físicos de teclado y ratón que realices.
          </p>
          <div className="space-y-1.5">
            <label htmlFor="rec-name" className="section-label">Nombre del flujo</label>
            <input
              id="rec-name"
              type="text"
              placeholder="ej. AutoVentas"
              value={name}
              onChange={e => setName(e.target.value)}
              className="field-input"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && name.trim()) { onStart(); } }}
            />
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-app-border flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn btn-ghost text-[11px]">Cancelar</button>
          <button
            onClick={() => { if (!name.trim()) { alert('Ingresa un nombre.'); return; } onStart(); }}
            className="btn btn-primary text-[11px]"
          >
            Comenzar grabación
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

/* ─── HelpModal ───────────────────────────────────────────────────── */
export function HelpModal({ isOpen, onClose }) {
  useModalDismissal(isOpen, onClose);
  if (!isOpen) return null;

  const sections = [
    {
      title: '1. Desencadenador (Paso #1)',
      color: 'text-primary',
      content: 'La primera tarjeta del flujo. Define cómo se dispara la automatización: Manual (solo desde la app), Atajo Global (hotkey física en cualquier ventana de Windows), Intervalo (cada X segundos) o Programado (a una hora fija del día).',
    },
    {
      title: '2. Capturar posición del ratón',
      color: 'text-secondary',
      content: 'En cualquier paso de ratón, expande la tarjeta y haz clic en "Capturar". Tendrás 3 segundos para mover el cursor a la posición deseada. Los ejes X e Y se guardarán automáticamente en píxeles reales de pantalla.',
    },
    {
      title: '3. Escribir texto continuo',
      color: 'text-accent',
      content: 'El paso "Escribir Texto" simula la mecanografía fluida de un string completo. Ideal para rellenar formularios, correos o cualquier campo de texto activo.',
    },
    {
      title: '4. Bucles y repetición infinita',
      color: 'text-amber-400',
      content: 'Usa "Inicio de Bucle" y "Fin de Bucle" para delimitar un bloque repetible. Configura la cantidad de iteraciones: con 0 repeticiones creas un bucle infinito que solo se detiene con CTRL+ALT+S.',
    },
    {
      title: '5. Menú contextual de pasos',
      color: 'text-success',
      content: 'Haz clic derecho sobre cualquier tarjeta del flujo para acceder a opciones: Activar/Desactivar (la tarjeta se saltea sin borrarla), Duplicar, Subir/Bajar de orden y Eliminar.',
    },
  ];

  return (
    <Backdrop onClose={onClose}>
      <div className="bg-app-panel border border-app-border rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-fadeIn" aria-labelledby="help-title">
        <div className="px-5 py-4 border-b border-app-border flex items-center justify-between flex-shrink-0">
          <h3 id="help-title" className="text-[13px] font-semibold text-text-primary flex items-center gap-2">
            <Icons.HelpCircle className="w-4 h-4 text-primary" />
            Instructivo de uso
          </h3>
          <button onClick={onClose} className="btn btn-ghost py-1 px-2 text-[10px]">Cerrar</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {sections.map((s, i) => (
            <div key={i} className="bg-app-bg border border-app-border rounded-lg p-4">
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${s.color}`}>{s.title}</div>
              <p className="text-[11px] text-text-secondary leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>

        <div className="px-5 py-3.5 border-t border-app-border flex justify-end flex-shrink-0">
          <button onClick={onClose} className="btn btn-primary text-[11px]">Entendido</button>
        </div>
      </div>
    </Backdrop>
  );
}

/* ─── PaletteDetailsModal ─────────────────────────────────────────── */
export function PaletteDetailsModal({ details, onClose }) {
  useModalDismissal(details !== null, onClose);
  if (!details) return null;

  return (
    <Backdrop onClose={onClose}>
      <div className="bg-app-panel border border-app-border rounded-xl shadow-2xl w-full max-w-sm animate-fadeIn" aria-labelledby="details-title">
        <div className="px-5 py-4 border-b border-app-border">
          <h3 id="details-title" className="text-[13px] font-semibold text-text-primary">{details.title}</h3>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-[11px] text-text-secondary leading-relaxed">{details.desc}</p>
          <div className="bg-app-bg border border-app-border rounded-lg p-3">
            <div className="section-label mb-1">Parámetros</div>
            <span className="mono text-[11px] text-secondary">{details.params}</span>
          </div>
        </div>
        <div className="px-5 py-3.5 border-t border-app-border flex justify-end">
          <button onClick={onClose} className="btn btn-primary text-[11px]">Cerrar</button>
        </div>
      </div>
    </Backdrop>
  );
}

/* ─── StepContextMenu ─────────────────────────────────────────────── */
export function StepContextMenu({ x, y, visible, index, step, onToggleDisable, onDuplicate, onMoveUp, onMoveDown, onRemove, stepsLength }) {
  if (!visible || index === null || !step) return null;

  const menuItems = [
    {
      label: step.disabled ? 'Activar paso' : 'Desactivar paso',
      icon: step.disabled ? Icons.Eye : Icons.EyeOff,
      action: () => onToggleDisable(index),
      className: 'text-text-secondary hover:text-text-primary',
    },
    {
      label: 'Duplicar paso',
      icon: Icons.Duplicate,
      action: () => onDuplicate(index),
      className: 'text-text-secondary hover:text-text-primary',
    },
    {
      label: 'Subir',
      icon: Icons.ArrowUp,
      action: () => onMoveUp(index),
      disabled: index <= 1,
      className: 'text-text-secondary hover:text-text-primary',
    },
    {
      label: 'Bajar',
      icon: Icons.ArrowDown,
      action: () => onMoveDown(index),
      disabled: index === stepsLength - 1,
      className: 'text-text-secondary hover:text-text-primary',
    },
    { separator: true },
    {
      label: 'Eliminar paso',
      icon: Icons.Trash,
      action: () => onRemove(index),
      className: 'text-danger hover:text-danger',
    },
  ];

  return (
    <div
      role="menu"
      className="fixed z-[9999] bg-app-panel border border-app-border rounded-lg shadow-xl py-1 w-44 animate-fadeIn"
      style={{ left: `${Math.min(x, window.innerWidth - 180)}px`, top: `${Math.min(y, window.innerHeight - 200)}px` }}
    >
      {menuItems.map((item, i) => {
        if (item.separator) {
          return <div key={i} className="h-px bg-app-border my-1 mx-2" />;
        }
        const Icon = item.icon;
        return (
          <button
            key={i}
            role="menuitem"
            onClick={item.action}
            disabled={item.disabled}
            className={`flex items-center gap-2.5 w-full px-3 py-1.5 text-[11px] font-medium ${item.className} hover:bg-app-bg transition-colors disabled:opacity-30 disabled:pointer-events-none outline-none focus-visible:bg-app-bg`}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}