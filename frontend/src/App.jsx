import React, { useState, useEffect } from 'react';
import api from './api/api';
import Icons from './components/Icons';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import LibraryView from './components/LibraryView';
import DocView from './components/DocView';
import BuilderView from './components/BuilderView';
import { RecordingModal, HelpModal, PaletteDetailsModal, StepContextMenu } from './components/Modals';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('theme-dark');
  const [status, setStatus] = useState({ recording: false, playing: false });
  const [macros, setMacros] = useState([]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'theme-dark' ? 'theme-light' : 'theme-dark'));
  };
  
  // Builder States
  const [builderName, setBuilderName] = useState('');
  const [builderTrigger, setBuilderTrigger] = useState('');
  const [builderSteps, setBuilderSteps] = useState([
    { type: 'trigger', trigger_mode: 'manual', trigger_hotkey: '', trigger_interval: 5, trigger_hour: '12:00', delay: 0.0, disabled: false }
  ]);
  const [editingStepIndex, setEditingStepIndex] = useState(null);

  // Key and Mouse Capturing States
  const [capturingKeyIndex, setCapturingKeyIndex] = useState(null);
  const [capturingTriggerIndex, setCapturingTriggerIndex] = useState(null);
  const [countdownStepIndex, setCountdownStepIndex] = useState(null);
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  // Context Menus State
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, index: null });
  const [paletteDetails, setPaletteDetails] = useState(null);

  // Recording Modal Dialog & Help Guide Modal
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [tempRecordName, setTempRecordName] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Drag and Drop States
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Status Polling
  useEffect(() => {
    fetchStatus();
    fetchMacros();

    const interval = setInterval(() => {
      fetchStatus();
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Global Context Menu Dismissal
  useEffect(() => {
    const closeMenu = () => setContextMenu({ visible: false, x: 0, y: 0, index: null });
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // Key and Trigger Keyboard capturing event effect
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (capturingKeyIndex !== null) {
        e.preventDefault();
        const modifiers = [];
        if (e.ctrlKey) modifiers.push('Key.ctrl');
        if (e.altKey) modifiers.push('Key.alt');
        if (e.shiftKey) modifiers.push('Key.shift');
        if (e.metaKey) modifiers.push('Key.cmd');
        
        let mainKey = mapJsKeyToPynput(e.key);
        if (modifiers.length > 0 && !mainKey.startsWith('Key.')) {
          mainKey = `${modifiers.join('+')}+${mainKey}`;
        } else if (modifiers.length > 0 && mainKey.startsWith('Key.')) {
          mainKey = modifiers.join('+');
        }

        updateStep(capturingKeyIndex, { key: mainKey });
        setCapturingKeyIndex(null);
      } else if (capturingTriggerIndex !== null) {
        e.preventDefault();
        const keys = [];
        if (e.ctrlKey) keys.push('ctrl');
        if (e.altKey) keys.push('alt');
        if (e.shiftKey) keys.push('shift');
        if (e.metaKey) keys.push('win');
        
        const mainKey = e.key;
        if (mainKey && !['Control', 'Shift', 'Alt', 'Meta'].includes(mainKey)) {
          let mappedKey = mainKey.toLowerCase();
          if (mappedKey === ' ') mappedKey = 'space';
          else if (mappedKey === 'arrowup') mappedKey = 'up';
          else if (mappedKey === 'arrowdown') mappedKey = 'down';
          else if (mappedKey === 'arrowleft') mappedKey = 'left';
          else if (mappedKey === 'arrowright') mappedKey = 'right';
          keys.push(mappedKey);
        }
        
        if (keys.length > 0) {
          const combo = keys.join('+');
          if (capturingTriggerIndex === 0) {
            updateStep(0, { trigger_hotkey: combo });
            setBuilderTrigger(combo);
          }
          setCapturingTriggerIndex(null);
        }
      }
    };

    if (capturingKeyIndex !== null || capturingTriggerIndex !== null) {
      window.addEventListener('keydown', handleGlobalKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [capturingKeyIndex, capturingTriggerIndex]);

  const mapJsKeyToPynput = (jsKey) => {
    const mapping = {
      ' ': 'Key.space',
      'Spacebar': 'Key.space',
      'Enter': 'Key.enter',
      'Backspace': 'Key.backspace',
      'Tab': 'Key.tab',
      'Escape': 'Key.esc',
      'Control': 'Key.ctrl',
      'Shift': 'Key.shift',
      'Alt': 'Key.alt',
      'Meta': 'Key.cmd',
      'ArrowUp': 'Key.up',
      'ArrowDown': 'Key.down',
      'ArrowLeft': 'Key.left',
      'ArrowRight': 'Key.right',
      'Delete': 'Key.delete',
      'Insert': 'Key.insert',
      'Home': 'Key.home',
      'End': 'Key.end',
      'PageUp': 'Key.page_up',
      'PageDown': 'Key.page_down',
      'CapsLock': 'Key.caps_lock',
      'NumLock': 'Key.num_lock',
      'ScrollLock': 'Key.scroll_lock',
      'Pause': 'Key.pause',
    };
    
    if (mapping[jsKey]) return mapping[jsKey];
    if (/^F[1-9][0-2]?$/.test(jsKey)) {
      return `Key.${jsKey.toLowerCase()}`;
    }
    return jsKey.toLowerCase();
  };

  const fetchStatus = async () => {
    try {
      const s = await api.getStatus();
      setStatus(s);
    } catch (err) {
      console.error("Error fetching status:", err);
    }
  };

  const fetchMacros = async () => {
    try {
      const m = await api.getMacros();
      setMacros(m);
    } catch (err) {
      console.error("Error fetching macros:", err);
    }
  };

  const handleStartRecording = async () => {
    try {
      await api.startRecording();
      fetchStatus();
    } catch (err) {
      alert("Error al iniciar grabación.");
    }
  };

  const handleStopRecording = async () => {
    try {
      const res = await api.stopRecording();
      fetchStatus();
      if (res && res.steps) {
        const withTrigger = [
          { type: 'trigger', trigger_mode: 'manual', trigger_hotkey: '', trigger_interval: 5, trigger_hour: '12:00', delay: 0.0, disabled: false },
          ...res.steps.map(s => ({ ...s, disabled: false }))
        ];
        setBuilderSteps(withTrigger);
        setBuilderName(tempRecordName || 'Macro Grabada');
        setTempRecordName('');
        setIsRecordingModalOpen(false);
        setActiveTab('builder');
      }
    } catch (err) {
      alert("Error al detener la grabación.");
    }
  };

  const handlePlayMacro = async (name) => {
    try {
      await api.playMacro(name);
      fetchStatus();
    } catch (err) {
      alert("Error al reproducir macro.");
    }
  };

  const handlePlaySteps = async () => {
    if (builderSteps.length <= 1) return;
    const activeSteps = builderSteps.filter(s => !s.disabled);
    try {
      await api.playSteps(activeSteps);
      fetchStatus();
    } catch (err) {
      alert("Error al reproducir pasos.");
    }
  };

  const handleStopAll = async () => {
    try {
      await api.stopAction();
      fetchStatus();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMacro = async (name) => {
    try {
      await api.deleteMacro(name);
      fetchMacros();
    } catch (err) {
      alert("Error al eliminar la macro.");
    }
  };

  const handleAddStep = (type, insertIndex = null) => {
    let newStep = { type, delay: 0.2, disabled: false, title: '', comment: '' };
    if (type === 'move') {
      newStep = { ...newStep, x: 500, y: 500 };
    } else if (type === 'click') {
      newStep = { ...newStep, x: 500, y: 500, button: 'left', pressed: true };
    } else if (type === 'key_press' || type === 'key_release') {
      newStep = { ...newStep, key: 'Key.space' };
    } else if (type === 'write_text') {
      newStep = { ...newStep, text: 'Hola Mundo' };
    } else if (type === 'scroll') {
      newStep = { ...newStep, x: 500, y: 500, dx: 0, dy: -1 };
    } else if (type === 'loop_start') {
      newStep = { ...newStep, loop_count: 5 };
    } else if (type === 'loop_end') {
      newStep = { ...newStep };
    } else if (type === 'conditional') {
      newStep = { ...newStep, cond_type: 'mouse_x', cond_val: 100 };
    }
    
    if (insertIndex !== null) {
      const updated = [...builderSteps];
      updated.splice(insertIndex, 0, newStep);
      setBuilderSteps(updated);
    } else {
      setBuilderSteps([...builderSteps, newStep]);
    }
  };

  const updateStep = (index, fields) => {
    const updated = [...builderSteps];
    updated[index] = { ...updated[index], ...fields };
    setBuilderSteps(updated);
    
    if (index === 0 && fields.trigger_hotkey !== undefined) {
      setBuilderTrigger(fields.trigger_hotkey);
    }
  };

  const removeStep = (index) => {
    if (index === 0) return;
    const updated = builderSteps.filter((_, i) => i !== index);
    setBuilderSteps(updated);
  };

  const duplicateStep = (index) => {
    if (index === 0) return;
    const stepToDup = builderSteps[index];
    const updated = [...builderSteps];
    updated.splice(index + 1, 0, { ...stepToDup });
    setBuilderSteps(updated);
  };

  const toggleDisableStep = (index) => {
    if (index === 0) return;
    updateStep(index, { disabled: !builderSteps[index].disabled });
  };

  const moveStepUp = (index) => {
    if (index <= 1) return;
    const updated = [...builderSteps];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setBuilderSteps(updated);
  };

  const moveStepDown = (index) => {
    if (index === 0 || index === builderSteps.length - 1) return;
    const updated = [...builderSteps];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setBuilderSteps(updated);
  };

  // Drag and Drop
  const handleDragStart = (e, index) => {
    if (index === 0) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (index === 0 || draggedIndex === null || draggedIndex === index) return;
    const updated = [...builderSteps];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    setBuilderSteps(updated);
    setDraggedIndex(null);
  };

  const startMouseCaptureCountdown = (index) => {
    setCountdownStepIndex(index);
    setCountdownSeconds(3);
    
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          captureGlobalMousePosition(index);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const captureGlobalMousePosition = async (index) => {
    try {
      const coords = await api.getMousePosition();
      if (coords && coords.x !== undefined) {
        updateStep(index, { x: coords.x, y: coords.y });
      }
    } catch (err) {
      console.error("Error capturing mouse position:", err);
    } finally {
      setCountdownStepIndex(null);
    }
  };

  const clearBuilder = () => {
    if (confirm("¿Vaciar todo el Constructor de Macros?")) {
      setBuilderSteps([
        { type: 'trigger', trigger_mode: 'manual', trigger_hotkey: '', trigger_interval: 5, trigger_hour: '12:00', delay: 0.0, disabled: false }
      ]);
      setBuilderName('');
      setBuilderTrigger('');
    }
  };

  const saveBuilderMacro = async () => {
    if (!builderName) {
      alert("Por favor ingrese un nombre para la macro.");
      return;
    }
    try {
      const isHotkey = builderSteps[0].trigger_mode === 'hotkey';
      const hotkey = isHotkey ? builderSteps[0].trigger_hotkey : null;
      await api.saveMacro(builderName, builderSteps, hotkey);
      alert("Macro guardada con éxito.");
      fetchMacros();
      setActiveTab('macros');
    } catch (err) {
      alert("Error al guardar la macro.");
    }
  };

  const loadMacroIntoBuilder = async (name) => {
    try {
      const details = await api.getMacro(name);
      if (details) {
        setBuilderName(details.name || name);
        let loadedSteps = details.steps || [];
        
        const hasTrigger = loadedSteps.length > 0 && loadedSteps[0].type === 'trigger';
        if (!hasTrigger) {
          loadedSteps = [
            { type: 'trigger', trigger_mode: details.trigger_key ? 'hotkey' : 'manual', trigger_hotkey: details.trigger_key || '', trigger_interval: 5, trigger_hour: '12:00', delay: 0.0, disabled: false },
            ...loadedSteps.map(s => ({ ...s, disabled: s.disabled || false }))
          ];
        } else {
          loadedSteps = loadedSteps.map(s => ({ ...s, disabled: s.disabled || false }));
        }
        
        setBuilderSteps(loadedSteps);
        setBuilderTrigger(details.trigger_key || '');
        setActiveTab('builder');
      }
    } catch (err) {
      alert("Error al cargar la macro.");
    }
  };

  const handleStepContextMenu = (e, index) => {
    if (index === 0) return;
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      index
    });
  };

  const handlePaletteContextMenu = (e, type) => {
    e.preventDefault();
    const detailsMapping = {
      'move': {
        title: 'Mover Ratón',
        desc: 'Mueve el puntero del ratón a unas coordenadas exactas en píxeles.',
        params: 'X (Ancho de pantalla), Y (Alto de pantalla)'
      },
      'click': {
        title: 'Clic de Ratón',
        desc: 'Realiza un clic (izquierdo, derecho o central) y permite mantenerlo pulsado o soltarlo.',
        params: 'Coordenadas X/Y, Tipo de Botón, Estado (Pulsar/Soltar)'
      },
      'scroll': {
        title: 'Desplazamiento (Scroll)',
        desc: 'Simula el giro de la rueda del ratón de forma horizontal o vertical.',
        params: 'Coordenadas X/Y, DX (horizontal), DY (vertical)'
      },
      'key_press': {
        title: 'Pulsar Tecla',
        desc: 'Presiona físicamente una tecla o combinación física de teclado.',
        params: 'Tecla a capturar (incluyendo modificadores como control/shift)'
      },
      'key_release': {
        title: 'Soltar Tecla',
        desc: 'Libera la tecla física previamente mantenida pulsada.',
        params: 'Tecla física'
      },
      'write_text': {
        title: 'Escribir Texto',
        desc: 'Escribe un string completo de caracteres en la pantalla (como simular mecanografía).',
        params: 'Texto de cadena exacto'
      },
      'loop_start': {
        title: 'Inicio de Bucle',
        desc: 'Representa el punto inicial de repetición de los pasos subsecuentes. Especificar 0 repeticiones causa un bucle infinito que corre de forma continua.',
        params: 'Cantidad de iteraciones (0 = Infinito)'
      },
      'loop_end': {
        title: 'Fin de Bucle',
        desc: 'Determina el punto de cierre del bucle para volver a evaluar la iteración correspondiente.',
        params: 'Ninguno (actúa como anclaje del bloque)'
      },
      'conditional': {
        title: 'Condición Operador (If)',
        desc: 'Compara la posición actual del cursor de ratón, saltándose el siguiente paso en el flujo conectado si la evaluación lógica resulta falsa.',
        params: 'Tipo de eje (X/Y), Valor de referencia (px)'
      }
    };
    if (detailsMapping[type]) {
      setPaletteDetails(detailsMapping[type]);
    }
  };

  const handleLoadTemplateSteps = (template) => {
    setBuilderSteps(template.steps);
    setBuilderName(template.name);
    setBuilderTrigger(template.trigger_key);
    setActiveTab('builder');
  };

  const handleCreateMacro = () => {
    setBuilderSteps([
      { type: 'trigger', trigger_mode: 'manual', trigger_hotkey: '', trigger_interval: 5, trigger_hour: '12:00', delay: 0.0, disabled: false }
    ]);
    setBuilderName('');
    setBuilderTrigger('');
    setActiveTab('builder');
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden select-none bg-app-bg text-text-primary ${theme}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        status={status}
        onOpenRecording={() => setIsRecordingModalOpen(true)}
        onStopRecording={handleStopRecording}
        onStopAll={handleStopAll}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col h-full overflow-hidden animate-fadeIn">
        {/* Dynamic Context Header */}
        <Header activeTab={activeTab} status={status} onStopAll={handleStopAll} />

        {/* Dynamic Context Views */}
        <main className="flex-1 overflow-y-auto p-6" style={{ height: 'calc(100vh - 80px)' }}>
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                macros={macros}
                status={status}
                onPlayMacro={handlePlayMacro}
                onStopMacro={handleStopAll}
                onEditMacro={loadMacroIntoBuilder}
              />
            )}

            {activeTab === 'library' && (
              <LibraryView
                macros={macros}
                status={status}
                onPlayMacro={handlePlayMacro}
                onEditMacro={loadMacroIntoBuilder}
                onDeleteMacro={handleDeleteMacro}
                onCreateMacro={handleCreateMacro}
                onLoadTemplateSteps={handleLoadTemplateSteps}
              />
            )}

            {activeTab === 'builder' && (
              <BuilderView
                builderName={builderName}
                setBuilderName={setBuilderName}
                builderSteps={builderSteps}
                onAddStep={handleAddStep}
                onRemoveStep={removeStep}
                onUpdateStep={updateStep}
                onClearBuilder={clearBuilder}
                onPlaySteps={handlePlaySteps}
                onSaveMacro={saveBuilderMacro}
                onToggleExpand={(idx) => setEditingStepIndex(editingStepIndex === idx ? null : idx)}
                expandedIndex={editingStepIndex}
                onStepContextMenu={handleStepContextMenu}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                capturingKeyIndex={capturingKeyIndex}
                setCapturingKeyIndex={setCapturingKeyIndex}
                capturingTriggerIndex={capturingTriggerIndex}
                setCapturingTriggerIndex={setCapturingTriggerIndex}
                countdownStepIndex={countdownStepIndex}
                onStartMouseCapture={startMouseCaptureCountdown}
                countdownSeconds={countdownSeconds}
                status={status}
                onOpenHelp={() => setIsHelpOpen(true)}
                onPaletteContextMenu={handlePaletteContextMenu}
              />
            )}

            {activeTab === 'docs' && <DocView />}
          </div>
        </main>
      </div>

      {/* Global Interactive Modals & Context Menus */}
      <StepContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        visible={contextMenu.visible}
        index={contextMenu.index}
        step={builderSteps[contextMenu.index]}
        onToggleDisable={toggleDisableStep}
        onDuplicate={duplicateStep}
        onMoveUp={moveStepUp}
        onMoveDown={moveStepDown}
        onRemove={removeStep}
        stepsLength={builderSteps.length}
      />

      <PaletteDetailsModal details={paletteDetails} onClose={() => setPaletteDetails(null)} />

      <RecordingModal
        isOpen={isRecordingModalOpen}
        onClose={() => setIsRecordingModalOpen(false)}
        name={tempRecordName}
        setName={setTempRecordName}
        onStart={handleStartRecording}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
