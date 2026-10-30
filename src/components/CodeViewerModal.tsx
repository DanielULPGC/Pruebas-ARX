import React, { useState, useMemo } from 'react';
import { ProjectFile } from '../data/modulesData';
import { sound } from '../utils/audio';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Search, 
  FileCode, 
  ExternalLink 
} from 'lucide-react';

interface CodeViewerModalProps {
  file: ProjectFile | null;
  onClose: () => void;
}

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({ file, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (!file) return null;

  const lines = useMemo(() => {
    return file.content.split('\n');
  }, [file.content]);

  const filteredMatchesCount = useMemo(() => {
    if (!searchTerm.trim()) return 0;
    return lines.filter((line) => line.toLowerCase().includes(searchTerm.toLowerCase())).length;
  }, [lines, searchTerm]);

  const copyToClipboard = () => {
    sound.playClick();
    navigator.clipboard.writeText(file.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadFile = () => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl h-[90vh] bg-[#1c1917] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#24201e] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#c2843a]/20 border border-[#c2843a]/30 flex items-center justify-center text-[#c2843a]">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm sm:text-base font-bold text-[#faf7f2]">
                  {file.filename}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/5 text-[#a8a29e] border border-white/5">
                  {file.badge}
                </span>
              </div>
              <p className="text-xs text-[#a8a29e]">
                Destino: <span className="font-mono text-[#e3a85c]">{file.targetPath}</span> · {lines.length} líneas · {(file.sizeBytes / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#faf7f2] flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#4ade80]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>

            <button
              onClick={downloadFile}
              className="px-3 py-1.5 rounded-lg bg-[#c2843a] hover:bg-[#e3a85c] text-xs font-bold text-[#1c1917] flex items-center gap-1.5 transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#a8a29e] hover:text-[#faf7f2] hover:bg-white/10 transition"
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-2.5 bg-[#171412] border-b border-white/5 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 w-full max-w-sm bg-[#24201e] px-3 py-1.5 rounded-lg border border-white/10">
            <Search className="w-3.5 h-3.5 text-[#a8a29e]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en el código..."
              className="bg-transparent border-none text-xs text-[#faf7f2] placeholder-[#78716c] focus:outline-none w-full"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-[#a8a29e] hover:text-[#faf7f2]">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {searchTerm && (
            <span className="text-[11px] text-[#a8a29e]">
              {filteredMatchesCount} coincidencia(s)
            </span>
          )}
        </div>

        {/* Code Content with Line Numbers */}
        <div className="flex-1 overflow-auto bg-[#141210] p-4 font-mono text-xs text-[#d8dee9] leading-relaxed select-text">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => {
                const lineNum = idx + 1;
                const isMatch = searchTerm && line.toLowerCase().includes(searchTerm.toLowerCase());
                return (
                  <tr
                    key={lineNum}
                    className={`hover:bg-white/5 ${isMatch ? 'bg-[#c2843a]/20' : ''}`}
                  >
                    <td className="w-12 pr-4 text-right select-none text-[#57534e] text-[11px] align-top">
                      {lineNum}
                    </td>
                    <td className="whitespace-pre overflow-x-visible align-top pl-2 border-l border-white/5">
                      {line || ' '}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
