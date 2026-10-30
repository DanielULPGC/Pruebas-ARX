import React, { useState } from 'react';
import JSZip from 'jszip';
import { ProjectFile, PROJECT_FILES } from '../data/modulesData';
import { sound } from '../utils/audio';
import { 
  Download, 
  FileCode, 
  Archive, 
  Copy, 
  Check, 
  Eye, 
  FolderGit2, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface DownloadCenterProps {
  onViewCode: (file: ProjectFile) => void;
}

export const DownloadCenter: React.FC<DownloadCenterProps> = ({ onViewCode }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  // Trigger browser download for a single text file
  const downloadSingleFile = (file: ProjectFile) => {
    sound.playClick();
    const blob = new Blob([file.content.trimStart()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy file content to clipboard
  const copyContent = (file: ProjectFile) => {
    sound.playClick();
    navigator.clipboard.writeText(file.content).then(() => {
      setCopiedId(file.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Package all files into a structured ZIP file
  const downloadAllAsZip = async () => {
    sound.playClick();
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const libFolder = zip.folder('lib');

      // Place core files into lib/
      PROJECT_FILES.forEach((f) => {
        if (f.folder === 'lib' && libFolder) {
          libFolder.file(f.filename, f.content);
        } else {
          zip.file(f.filename, f.content);
        }
      });

      // Add README.md
      const readmeContent = `# Las Manos Que Construyeron La Historia · Suite XR Blocks v3.12

Este paquete contiene todos los módulos necesarios para tu proyecto:

## Estructura de carpetas recomendada:
tu-proyecto/
├── index.html
├── prehistoria.html
├── edad-media.html
├── edad-moderna.html
├── edad-contemporanea.html
└── lib/
    ├── estilos.css
    ├── xr-adapter.js
    ├── xr-fisica.js
    └── xrblocks.js

## Cómo activarlo en 2 líneas:
Al final del script de cualquiera de tus capítulos HTML, añade:
\`\`\`javascript
import { conectarXRBlocks } from "./lib/xr-adapter.js";
const xr = conectarXRBlocks({ renderer, scene, camera, DEC, estado, empezarTactil, aPantalla, getEtapa: () => etapa });
\`\`\`
¡Y listo! Aparecerá automáticamente el botón de Realidad Mixta / Maqueta 3D XR Blocks.
`;
      zip.file('README.txt', readmeContent);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'las-manos-que-construyeron-la-historia-v3.12.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      sound.playCompletion();
    } catch (err) {
      console.error('Error generating zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const coreFiles = PROJECT_FILES.filter((f) => f.folder === 'lib');
  const otherFiles = PROJECT_FILES.filter((f) => f.folder !== 'lib');

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner with ZIP Batch Download */}
      <div className="bg-gradient-to-r from-[#292524] via-[#24201e] to-[#1c1917] border border-white/15 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c2843a]/15 text-[#e3a85c] text-xs font-semibold border border-[#c2843a]/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Versión 3.12 · Módulos Listos para Usar</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#faf7f2] font-historical">
            Descarga de Archivos para tu Carpeta <code className="text-[#c2843a] text-lg">lib/</code>
          </h2>
          <p className="text-sm text-[#a8a29e] leading-relaxed">
            Puedes descargar cada archivo individualmente o descargar todo el paquete estructurado con un solo clic. Sin necesidad de copiar y pegar manualmente.
          </p>
        </div>

        <button
          onClick={downloadAllAsZip}
          disabled={isZipping}
          className="w-full md:w-auto px-6 py-4 rounded-xl bg-[#c2843a] hover:bg-[#e3a85c] text-[#1c1917] font-bold text-base flex items-center justify-center gap-3 transition shadow-lg active:scale-95 shrink-0"
        >
          <Archive className="w-5 h-5" />
          <span>{isZipping ? 'Comprimiendo ZIP...' : 'Descargar TODO en ZIP (.zip)'}</span>
        </button>
      </div>

      {/* Core Library Files (to be placed in lib/) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#faf7f2]">
          <FolderGit2 className="w-4 h-4 text-[#c2843a]" />
          <span>Archivos para tu carpeta <code className="text-[#c2843a]">lib/</code></span>
          <span className="text-xs text-[#a8a29e] font-normal">({coreFiles.length} módulos)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coreFiles.map((file, idx) => (
            <div
              key={file.id}
              className="bg-[#24201e] border border-white/10 hover:border-white/20 rounded-xl p-5 flex flex-col justify-between gap-4 transition shadow-md"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#c2843a]/20 text-[#c2843a] text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h3 className="font-mono text-base font-bold text-[#faf7f2]">
                      {file.filename}
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white/5 text-[#a8a29e] border border-white/5">
                    {file.badge}
                  </span>
                </div>

                <p className="text-xs text-[#a8a29e] leading-relaxed">
                  {file.description}
                </p>

                <div className="text-[11px] text-[#78716c] font-mono">
                  Ruta destino: <span className="text-[#faf7f2]">{file.targetPath}</span> · {(file.sizeBytes / 1024).toFixed(1)} KB
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                <button
                  onClick={() => downloadSingleFile(file)}
                  className="flex-1 px-3.5 py-2 rounded-lg bg-[#c2843a] hover:bg-[#e3a85c] text-[#1c1917] font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </button>

                <button
                  onClick={() => onViewCode(file)}
                  title="Inspeccionar código fuente"
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#faf7f2] text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Ver</span>
                </button>

                <button
                  onClick={() => copyContent(file)}
                  title="Copiar contenido al portapapeles"
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#a8a29e] hover:text-[#faf7f2] transition"
                >
                  {copiedId === file.id ? (
                    <Check className="w-4 h-4 text-[#4ade80]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Standalone Files (descargar-archivos.html and samples) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#faf7f2]">
          <FileCode className="w-4 h-4 text-[#38bdf8]" />
          <span>Archivos Autónomos y Ejemplos de Capítulos</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otherFiles.map((file) => (
            <div
              key={file.id}
              className="bg-[#24201e] border border-white/10 hover:border-white/20 rounded-xl p-5 flex flex-col justify-between gap-4 transition shadow-md"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-mono text-base font-bold text-[#faf7f2]">
                    {file.filename}
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white/5 text-[#38bdf8] border border-white/5">
                    {file.badge}
                  </span>
                </div>

                <p className="text-xs text-[#a8a29e] leading-relaxed">
                  {file.description}
                </p>

                <div className="text-[11px] text-[#78716c] font-mono">
                  Ubicación: <span className="text-[#faf7f2]">{file.targetPath}</span> · {(file.sizeBytes / 1024).toFixed(1)} KB
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                <button
                  onClick={() => downloadSingleFile(file)}
                  className="flex-1 px-3.5 py-2 rounded-lg bg-[#38bdf8] hover:bg-[#7dd3fc] text-[#1c1917] font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar {file.filename}</span>
                </button>

                <button
                  onClick={() => onViewCode(file)}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#faf7f2] text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Ver</span>
                </button>

                <button
                  onClick={() => copyContent(file)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#a8a29e] hover:text-[#faf7f2] transition"
                >
                  {copiedId === file.id ? (
                    <Check className="w-4 h-4 text-[#4ade80]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
