import React from 'react';
import { GeneratedDesign } from '../types';
import { Download, Share2, Info, Maximize2, Loader, Sparkles } from 'lucide-react'; // Added Loader, Sparkles icons

interface DesignShowcaseProps {
  design: GeneratedDesign | null;
  generationPhase: 'idle' | 'prompting' | 'imaging'; // New prop to indicate loading phase
  openImageModal: (imageUrl: string) => void;
}

const DesignShowcase: React.FC<DesignShowcaseProps> = ({ design, generationPhase, openImageModal }) => {
  const handleDownload = () => {
    if (design) {
      const link = document.createElement('a');
      link.href = design.imageUrl;
      link.download = `booth-design-${design.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Loading States
  if (generationPhase !== 'idle') {
    return (
      <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-800/30 rounded-xl border border-slate-700 p-8 relative overflow-hidden">
        {/* Abstract Loading Animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 animate-pulse" />
        <div className="relative z-10 text-center">
            {generationPhase === 'prompting' && (
              <>
                <Sparkles className="w-16 h-16 text-blue-400 animate-pulse-fast mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-white">Crafting Your Prompt...</h3>
                <p className="text-sm text-slate-400 mt-2">AI is analyzing requirements for optimal image generation.</p>
              </>
            )}
            {generationPhase === 'imaging' && (
              <>
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-2 border-4 border-indigo-500 border-r-transparent rounded-full animate-spin-reverse delay-100"></div>
                  <div className="absolute inset-4 flex items-center justify-center">
                    <Loader className="w-6 h-6 text-white animate-pulse" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white">Rendering 3D Concept...</h3>
                <p className="text-sm text-slate-400 mt-2">Generating high-fidelity visuals. This may take a moment.</p>
              </>
            )}
        </div>
      </div>
    );
  }

  // Display Full Design
  if (design) {
    return (
      <div className="space-y-6 animate-fade-in">
          {/* Main Image Card */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl group">
              <div className="relative aspect-[16/9] bg-slate-900">
                  <img 
                      src={design?.imageUrl} 
                      alt="Generated Booth Design" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
                      onClick={() => openImageModal(design.imageUrl)}
                      aria-label="View design in full screen"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-6">
                      <button 
                          onClick={handleDownload}
                          className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-3 rounded-lg transition-colors border border-white/20 flex items-center space-x-2"
                          title="Download Image"
                          aria-label="Download Image"
                      >
                          <Download className="w-5 h-5" />
                          <span className="hidden sm:inline">Download</span>
                      </button>
                      <button 
                          onClick={() => openImageModal(design.imageUrl)}
                          className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-3 rounded-lg transition-colors border border-white/20 flex items-center space-x-2"
                          title="View Full Screen"
                          aria-label="View Full Screen"
                      >
                          <Maximize2 className="w-5 h-5" />
                          <span className="hidden sm:inline">Fullscreen</span>
                      </button>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg transition-colors flex items-center space-x-2">
                          <Share2 className="w-4 h-4" />
                          <span>Share Design</span>
                      </button>
                  </div>
              </div>
          </div>

          {/* Info Card */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <div className="flex items-start space-x-4">
                  <div className="bg-indigo-500/10 p-3 rounded-lg flex-shrink-0">
                      <Info className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Design Rationale</h4>
                      <p className="text-slate-300 leading-relaxed text-sm">
                          {design?.rationale}
                      </p>
                      
                      <div className="mt-4 pt-4 border-t border-slate-700">
                          <p className="text-xs text-slate-500 font-mono break-all line-clamp-2">
                              PROMPT: {design?.promptUsed}
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    );
  }

  // Default "Ready to Visualize"
  return (
    <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-700 p-8 text-center">
      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <Maximize2 className="w-8 h-8 text-slate-600" />
      </div>
      <h3 className="text-xl font-medium text-white mb-2">Ready to Visualize</h3>
      <p className="text-slate-400 max-w-sm">
        Fill out the configuration form to generate your custom exhibition booth concept using AI.
      </p>
    </div>
  );
};

export default DesignShowcase;