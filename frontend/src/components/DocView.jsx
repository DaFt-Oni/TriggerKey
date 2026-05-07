import React from 'react';
import Icons from './Icons';

export default function DocView() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Hero section */}
      <div className="bg-app-panel border border-app-border p-6 rounded-2xl shadow-sm text-left">
        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Icons.DocumentText className="w-5 h-5 text-primary" /> Centro de Conocimiento
        </h3>
        <p className="text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">
          Consulta las especificaciones de simulación, la guía oficial de teclas físicas y el monitor de seguridad integrado para programar secuencias estables y de alto rendimiento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {/* Keyboard Shortcuts Guide */}
        <section className="bg-app-panel border border-app-border p-6 rounded-2xl shadow-sm flex flex-col justify-between" aria-labelledby="shortcuts-heading">
          <div className="space-y-4">
            <h4 id="shortcuts-heading" className="text-xs font-bold tracking-widest text-primary uppercase flex items-center gap-2">
              <Icons.Keyboard className="w-4 h-4 text-primary" /> Guía de Teclas
            </h4>
            <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
              Utiliza la nomenclatura oficial para pulsar teclas físicas de forma asíncrona o programar disparadores locales combinados por el operador (<span className="text-primary font-bold">+</span>):
            </p>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-2.5 bg-app-bg rounded-xl border border-app-border hover:bg-app-panel transition-all">
                <span className="text-[10px] font-semibold text-text-secondary">Modificadores</span>
                <span className="font-mono text-[9px] text-secondary font-bold bg-app-panel px-2 py-0.5 rounded border border-app-border">
                  ctrl, alt, shift, win
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-app-bg rounded-xl border border-app-border hover:bg-app-panel transition-all">
                <span className="text-[10px] font-semibold text-text-secondary">Especiales</span>
                <span className="font-mono text-[9px] text-secondary font-bold bg-app-panel px-2 py-0.5 rounded border border-app-border">
                  space, enter, esc, tab
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-app-bg rounded-xl border border-app-border hover:bg-app-panel transition-all">
                <span className="text-[10px] font-semibold text-text-secondary">Función</span>
                <span className="font-mono text-[9px] text-secondary font-bold bg-app-panel px-2 py-0.5 rounded border border-app-border">
                  f1 - f12
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-app-bg rounded-xl border border-app-border hover:bg-app-panel transition-all">
                <span className="text-[10px] font-semibold text-text-secondary">Abecedario</span>
                <span className="font-mono text-[9px] text-secondary font-bold bg-app-panel px-2 py-0.5 rounded border border-app-border">
                  a - z, 0 - 9
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Security Monitoring */}
        <section className="bg-app-panel border border-app-border p-6 rounded-2xl shadow-sm flex flex-col justify-between" aria-labelledby="safety-heading">
          <div className="space-y-4">
            <h4 id="safety-heading" className="text-xs font-bold tracking-widest text-danger uppercase flex items-center gap-2">
              <Icons.Stop className="w-4 h-4 text-danger" /> Parada Segura
            </h4>
            <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
              TriggerKey cuenta con un hilo prioritario de interrupción en tiempo real. Si un bucle o ráfaga de clicks se ejecuta indefinidamente, pulsa:
            </p>
            <div className="bg-danger/10 border border-danger/20 p-4 rounded-xl text-center font-mono font-extrabold text-xs text-danger my-4 tracking-widest">
              CTRL + ALT + S
            </div>
            <p className="text-[10px] text-text-muted leading-normal font-medium">
              Esto detendrá inmediatamente toda simulación física de ratón o teclado en curso de forma garantizada y limpia.
            </p>
          </div>
        </section>

        {/* Best Practices */}
        <section className="bg-app-panel border border-app-border p-6 rounded-2xl shadow-sm flex flex-col justify-between" aria-labelledby="best-practices-heading">
          <div className="space-y-4">
            <h4 id="best-practices-heading" className="text-xs font-bold tracking-widest text-success uppercase flex items-center gap-2">
              <Icons.Check className="w-4 h-4 text-success" /> Buenas Prácticas
            </h4>
            <ul className="space-y-2.5 text-[10px] text-text-secondary font-medium">
              <li className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0 mt-1" />
                <span><strong>Agregar Esperas (Delay):</strong> Pon un delay mínimo de 0.05s entre pulsaciones para que el sistema operativo procese el evento.</span>
              </li>
              <li className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0 mt-1" />
                <span><strong>Bucle Infinito:</strong> Si deseas iteraciones infinitas, establece el recuento del bucle en 0 y contrólalo con el atajo global.</span>
              </li>
              <li className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0 mt-1" />
                <span><strong>Ahorro Energético:</strong> Deshabilita temporalmente pasos en lugar de eliminarlos para de purar secuencias complejas.</span>
              </li>
            </ul>
          </div>
        </section>
      </div>

      <div className="text-center pt-4 text-[9px] text-text-muted font-bold tracking-widest uppercase">
        TriggerKey Studio v1.1.0 • Pro Edition • 0 Emojis
      </div>
    </div>
  );
}
