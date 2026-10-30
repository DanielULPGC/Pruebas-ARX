import React, { useState, useEffect } from 'react';
import { sound } from '../utils/audio';
import { 
  Zap, 
  Copy, 
  Check, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Laptop, 
  Glasses, 
  Cpu, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const QuickGuide: React.FC = () => {
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);
  const [copiedFullBlock, setCopiedFullBlock] = useState<boolean>(false);
  const [selectedTarget, setSelectedTarget] = useState<string>('prehistoria.html');

  // Diagnostics state
  const [diagnostics, setDiagnostics] = useState<{
    webgl2: boolean;
    gpuName: string;
    isSoftwareGl: boolean;
    webxr: boolean;
    immersiveAr: boolean | null;
    immersiveVr: boolean | null;
    gamepads: boolean;
    pointerEvents: boolean;
  }>({
    webgl2: false,
    gpuName: 'Comprobando...',
    isSoftwareGl: false,
    webxr: false,
    immersiveAr: null,
    immersiveVr: null,
    gamepads: false,
    pointerEvents: false,
  });

  useEffect(() => {
    // Run diagnostics
    let gl2 = false;
    let gpu = 'Desconocido';
    let isSoft = false;
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2');
      if (gl) {
        gl2 = true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        isSoft = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      }
    } catch {
      // Ignore
    }

    const hasWebXr = typeof navigator !== 'undefined' && 'xr' in navigator && !!navigator.xr;
    const hasGamepads = typeof navigator !== 'undefined' && 'getGamepads' in navigator;
    const hasPointer = typeof window !== 'undefined' && 'PointerEvent' in window;

    setDiagnostics((prev) => ({
      ...prev,
      webgl2: gl2,
      gpuName: gpu,
      isSoftwareGl: isSoft,
      webxr: hasWebXr,
      gamepads: hasGamepads,
      pointerEvents: hasPointer,
    }));

    if (hasWebXr && navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then((res) => {
        setDiagnostics((d) => ({ ...d, immersiveAr: res }));
      }).catch(() => {
        setDiagnostics((d) => ({ ...d, immersiveAr: false }));
      });
      navigator.xr.isSessionSupported('immersive-vr').then((res) => {
        setDiagnostics((d) => ({ ...d, immersiveVr: res }));
      }).catch(() => {
        setDiagnostics((d) => ({ ...d, immersiveVr: false }));
      });
    } else {
      setDiagnostics((d) => ({ ...d, immersiveAr: false, immersiveVr: false }));
    }
  }, []);

  const snippetTwoLines = `import { conectarXRBlocks } from "./lib/xr-adapter.js";
const xr = conectarXRBlocks({ renderer, scene, camera, DEC, estado, empezarTactil, aPantalla, getEtapa: () => etapa });`;

  const fullIntegrationExample = `// Al final de tu <script type="module"> en ${selectedTarget}:
import { conectarXRBlocks } from "./lib/xr-adapter.js";

// Conectar con tu escena Three.js existente:
const xr = conectarXRBlocks({
  renderer,
  scene,
  camera,
  DEC,
  estado,
  empezarTactil,
  aPantalla,
  getEtapa: () => etapa
});

// En tu bucle de animación habitual:
function animar() {
  renderer.setAnimationLoop(() => {
    // ... tus cálculos previos ...
    if (xr) xr.tick();
    renderer.render(scene, camera);
  });
}
animar();`;

  const copySnippet = () => {
    sound.playClick();
    navigator.clipboard.writeText(snippetTwoLines).then(() => {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    });
  };

  const copyFullBlock = () => {
    sound.playClick();
    navigator.clipboard.writeText(fullIntegrationExample).then(() => {
      setCopiedFullBlock(true);
      setTimeout(() => setCopiedFullBlock(false), 2000);
    });
  };

  return (
    <div className="space-y-8">
      {/* 10-Second Guide Card */}
      <div className="bg-[#24201e] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#c2843a]/20 border border-[#c2843a]/30 flex items-center justify-center text-[#c2843a]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#faf7f2] font-historical">
              Truco Rápido: Conéctalo en 10 Segundos
            </h2>
            <p className="text-xs sm:text-sm text-[#a8a29e]">
              Sin reemplazar tus 5 archivos HTML enteros. Añade únicamente 2 líneas al final de tu script.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#1c1917] border border-white/5 rounded-xl p-4 flex gap-3 items-start">
            <span className="w-7 h-7 rounded-lg bg-[#c2843a] text-[#1c1917] font-bold text-xs flex items-center justify-center shrink-0">
              1
            </span>
            <div className="text-xs space-y-1">
              <div className="font-bold text-[#faf7f2]">Guarda el archivo en tu carpeta</div>
              <p className="text-[#a8a29e]">
                Descarga <code className="text-[#c2843a]">xr-adapter.js</code> y colócalo dentro de tu carpeta <code className="text-[#c2843a]">lib/</code>.
              </p>
            </div>
          </div>

          <div className="bg-[#1c1917] border border-white/5 rounded-xl p-4 flex gap-3 items-start">
            <span className="w-7 h-7 rounded-lg bg-[#c2843a] text-[#1c1917] font-bold text-xs flex items-center justify-center shrink-0">
              2
            </span>
            <div className="text-xs space-y-1">
              <div className="font-bold text-[#faf7f2]">Añade 2 líneas al final del script</div>
              <p className="text-[#a8a29e]">
                Aparecerá automáticamente el botón <span className="text-[#38bdf8]">«Modo Realidad Mixta · Maqueta 3D (XR Blocks)»</span>.
              </p>
            </div>
          </div>
        </div>

        {/* The 2-line code snippet */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#a8a29e]">
            <span className="font-mono flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#c2843a]" />
              Las 2 líneas mágicas de conexión:
            </span>
            <button
              onClick={copySnippet}
              className="text-xs font-semibold px-2.5 py-1 rounded bg-[#c2843a] hover:bg-[#e3a85c] text-[#1c1917] flex items-center gap-1.5 transition"
            >
              {copiedSnippet ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar 2 líneas</span>
                </>
              )}
            </button>
          </div>

          <pre className="bg-[#141210] border border-white/10 rounded-xl p-4 overflow-x-auto text-xs font-mono text-[#4ade80] leading-relaxed shadow-inner">
            <code>{snippetTwoLines}</code>
          </pre>
        </div>

        {/* Detailed Chapter Selector & Full integration snippet */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-[#a8a29e] font-semibold">
              Personalizar para tu capítulo:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                'index.html',
                'prehistoria.html',
                'edad-media.html',
                'edad-moderna.html',
                'edad-contemporanea.html',
              ].map((fileName) => (
                <button
                  key={fileName}
                  onClick={() => setSelectedTarget(fileName)}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-lg transition ${
                    selectedTarget === fileName
                      ? 'bg-[#c2843a] text-[#1c1917] font-bold'
                      : 'bg-white/5 text-[#a8a29e] hover:bg-white/10 hover:text-[#faf7f2]'
                  }`}
                >
                  {fileName}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <pre className="bg-[#141210] border border-white/10 rounded-xl p-4 overflow-x-auto text-[11px] font-mono text-[#d8dee9] leading-relaxed">
              <code>{fullIntegrationExample}</code>
            </pre>
            <button
              onClick={copyFullBlock}
              className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[#faf7f2] flex items-center gap-1.5 transition"
            >
              {copiedFullBlock ? <Check className="w-3 h-3 text-[#4ade80]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedFullBlock ? 'Copiado' : 'Copiar bloque'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Diagnostics & Compatibility Hub */}
      <div className="bg-[#24201e] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#38bdf8]/20 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#faf7f2] font-historical">
              Diagnóstico de Compatibilidad de tu Navegador
            </h3>
            <p className="text-xs text-[#a8a29e]">
              Verificación en tiempo real de aceleración gráfica y estándares WebXR / XR Blocks en este entorno.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* WebGL2 */}
          <div className="bg-[#1c1917] border border-white/5 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#a8a29e]">WebGL 2.0 3D</span>
              {diagnostics.webgl2 ? (
                <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
              ) : (
                <XCircle className="w-4 h-4 text-[#f87171]" />
              )}
            </div>
            <div className="text-xs font-bold text-[#faf7f2]">
              {diagnostics.webgl2 ? 'Operativo' : 'No disponible'}
            </div>
            <div className="text-[10px] text-[#78716c] truncate" title={diagnostics.gpuName}>
              GPU: {diagnostics.gpuName}
            </div>
          </div>

          {/* WebXR API */}
          <div className="bg-[#1c1917] border border-white/5 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#a8a29e]">API WebXR</span>
              {diagnostics.webxr ? (
                <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
              ) : (
                <HelpCircle className="w-4 h-4 text-[#facc15]" />
              )}
            </div>
            <div className="text-xs font-bold text-[#faf7f2]">
              {diagnostics.webxr ? 'Detectado en navegador' : 'Modo fallback táctil'}
            </div>
            <div className="text-[10px] text-[#78716c]">
              {diagnostics.webxr ? 'Soporte XR nativo' : 'Simulación de ratón activa'}
            </div>
          </div>

          {/* Immersive AR */}
          <div className="bg-[#1c1917] border border-white/5 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#a8a29e]">Realidad Aumentada (AR)</span>
              {diagnostics.immersiveAr ? (
                <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#a8a29e]">
                  {diagnostics.immersiveAr === null ? '...' : 'Requiere Gafas'}
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-[#faf7f2]">
              {diagnostics.immersiveAr ? 'Cámara AR Lista' : 'Inactivo en monitor'}
            </div>
            <div className="text-[10px] text-[#78716c]">
              Compatible con Quest / Vision / ARCore
            </div>
          </div>

          {/* Gamepad / Controllers */}
          <div className="bg-[#1c1917] border border-white/5 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#a8a29e]">Mandos y Pinza XR</span>
              {diagnostics.gamepads ? (
                <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
              ) : (
                <HelpCircle className="w-4 h-4 text-[#a8a29e]" />
              )}
            </div>
            <div className="text-xs font-bold text-[#faf7f2]">
              {diagnostics.gamepads ? 'API Gamepad lista' : 'Simulación virtual'}
            </div>
            <div className="text-[10px] text-[#78716c]">
              Eventos selectstart / selectend
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
