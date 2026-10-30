import React, { useState } from 'react';
import { XRSimulationMaquette } from './components/XRSimulationMaquette';
import { DownloadCenter } from './components/DownloadCenter';
import { QuickGuide } from './components/QuickGuide';
import { CodeViewerModal } from './components/CodeViewerModal';
import { ProjectFile, PROJECT_FILES } from './data/modulesData';
import { sound } from './utils/audio';
import { 
  Box, 
  Download, 
  Zap, 
  Layers, 
  FileCode2, 
  History, 
  ExternalLink, 
  ShieldCheck, 
  Glasses, 
  Globe 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulador' | 'descargas' | 'guia'>('descargas');
  const [inspectingFile, setInspectingFile] = useState<ProjectFile | null>(null);

  const handleTabChange = (tab: 'simulador' | 'descargas' | 'guia') => {
    sound.playClick();
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#1c1917] text-[#faf7f2] flex flex-col selection:bg-[#c2843a] selection:text-[#1c1917]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#1c1917]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c2843a] to-[#966124] flex items-center justify-center text-[#1c1917] font-bold shadow-md shadow-[#c2843a]/20">
              <History className="w-5 h-5 text-[#1c1917]" />
            </div>
            <div>
              <div className="font-historical text-base sm:text-lg font-black tracking-wide text-[#faf7f2] flex items-center gap-2">
                <span>LAS MANOS QUE CONSTRUYERON LA HISTORIA</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#c2843a]/20 text-[#e3a85c] font-bold border border-[#c2843a]/30">
                  v3.12 · XR Blocks
                </span>
              </div>
              <div className="text-[11px] text-[#a8a29e] hidden sm:block">
                Centro de Descarga Directa & Suite de Realidad Mixta / WebXR
              </div>
            </div>
          </div>

          {/* Navigation Pill Switcher */}
          <nav className="flex items-center gap-1 bg-[#24201e] p-1 rounded-xl border border-white/10 text-xs font-semibold">
            <button
              onClick={() => handleTabChange('descargas')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'descargas'
                  ? 'bg-[#c2843a] text-[#1c1917] font-bold shadow'
                  : 'text-[#a8a29e] hover:text-[#faf7f2]'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargas</span>
            </button>

            <button
              onClick={() => handleTabChange('simulador')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'simulador'
                  ? 'bg-[#c2843a] text-[#1c1917] font-bold shadow'
                  : 'text-[#a8a29e] hover:text-[#faf7f2]'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Simulador 3D</span>
            </button>

            <button
              onClick={() => handleTabChange('guia')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'guia'
                  ? 'bg-[#c2843a] text-[#1c1917] font-bold shadow'
                  : 'text-[#a8a29e] hover:text-[#faf7f2]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guía 10 seg</span>
              <span className="sm:hidden">Guía</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Header Area */}
      <section className="border-b border-white/10 bg-gradient-to-b from-[#24201e] to-[#1c1917] py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3">
            <h1 className="text-2xl sm:text-4xl font-black text-[#faf7f2] font-historical tracking-wide">
              Arquitectura Histórica en Realidad Mixta
            </h1>
            <p className="text-sm sm:text-base text-[#a8a29e] leading-relaxed">
              Descarga sin fricciones los nuevos módulos para tu carpeta <code className="text-[#c2843a] font-mono font-bold">lib/</code> (<span className="text-[#faf7f2]">estilos.css</span>, <span className="text-[#faf7f2]">xr-adapter.js</span>, <span className="text-[#faf7f2]">xr-fisica.js</span> y <span className="text-[#faf7f2]">xrblocks.js</span>), o prueba la maqueta física 3D en tiempo real directamente en tu navegador.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-[#a8a29e]">
              <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4ade80]" />
                100% Funcional Offline (Sin 404s)
              </span>
              <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                <Glasses className="w-3.5 h-3.5 text-[#38bdf8]" />
                WebXR Immersive-AR / VR
              </span>
              <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                <Layers className="w-3.5 h-3.5 text-[#c2843a]" />
                Física CaidaFisica3D (9.8m/s²)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activeTab === 'descargas' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <DownloadCenter onViewCode={(file) => setInspectingFile(file)} />
          </div>
        )}

        {activeTab === 'simulador' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-historical text-[#faf7f2]">
                  Simulador de Maqueta 3D Interactiva
                </h2>
                <p className="text-xs sm:text-sm text-[#a8a29e]">
                  Visualiza el comportamiento de la maqueta a escala de 0.55m y prueba la aceleración gravitatoria al encajar las piezas clave de cada época.
                </p>
              </div>

              <button
                onClick={() => handleTabChange('descargas')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#faf7f2] flex items-center gap-1.5 border border-white/10 transition"
              >
                <Download className="w-3.5 h-3.5 text-[#c2843a]" />
                <span>Ir al centro de descargas</span>
              </button>
            </div>

            <XRSimulationMaquette />

            <div className="bg-[#24201e] border border-white/10 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-[#faf7f2] flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#c2843a]" />
                  <span>Escala Maqueta 0.55m</span>
                </div>
                <p className="text-[#a8a29e] leading-relaxed">
                  En modo WebXR, el rig sitúa la escena a <code className="text-[#faf7f2]">-0.65m</code> de profundidad y escala el ancho a 55 cm, ideal para una mesa de trabajo real.
                </p>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-[#faf7f2] flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                  <span>Raycasting al Plano Z0</span>
                </div>
                <p className="text-[#a8a29e] leading-relaxed">
                  El adaptador proyecta el rayo del mando XR contra el plano de la maqueta, permitiendo usar exactamente las mismas coordenadas interactivas táctiles.
                </p>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-[#faf7f2] flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#4ade80]" />
                  <span>Amortiguación Física</span>
                </div>
                <p className="text-[#a8a29e] leading-relaxed">
                  <code className="text-[#faf7f2]">CaidaFisica3D</code> simula rebote elástico leve (<code className="text-[#c2843a]">-vy * 0.25</code>) y ejecuta el callback <code className="text-[#faf7f2]">alEncajar()</code> al frenar.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'guia' && (
          <div className="animate-in fade-in duration-200">
            <QuickGuide />
          </div>
        )}
      </main>

      {/* Global Code Inspector Modal */}
      <CodeViewerModal
        file={inspectingFile}
        onClose={() => setInspectingFile(null)}
      />

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#171412] py-8 text-xs text-[#78716c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-historical font-bold text-[#a8a29e]">
              Las Manos Que Construyeron La Historia
            </span>
            <span>·</span>
            <span>Adaptador Universal XR Blocks & WebXR</span>
          </div>

          <div className="flex items-center gap-4 text-[#a8a29e]">
            <span>Three.js PBR</span>
            <span>·</span>
            <span>Web Audio API</span>
            <span>·</span>
            <span>W3C WebXR Device API</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
