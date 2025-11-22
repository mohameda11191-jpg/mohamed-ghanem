
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ConfigurationForm from './components/ConfigurationForm';
import DesignShowcase from './components/DesignShowcase';
import DesignHistory from './components/DesignHistory';
import FullScreenImageModal from './components/FullScreenImageModal';
import WelcomePage from './components/WelcomePage'; // Import the new WelcomePage
import { BoothRequirements, GeneratedDesign, PageName } from './types';
import { generateOptimizedPrompt, generateBoothImage } from './services/gemini';

// Helper to load designs from local storage
const loadDesignsFromLocalStorage = (): GeneratedDesign[] => {
  try {
    const storedDesigns = localStorage.getItem('boothGenDesigns');
    return storedDesigns ? JSON.parse(storedDesigns) : [];
  } catch (error) {
    console.error("Failed to load designs from local storage:", error);
    return [];
  }
};

// Helper function to convert File to Base64
const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1]; // Remove data:mime/type;base64, prefix
      resolve({ data: base64String, mimeType: file.type });
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

function App() {
  const [currentDesign, setCurrentDesign] = useState<GeneratedDesign | null>(null);
  const [allDesigns, setAllDesigns] = useState<GeneratedDesign[]>(loadDesignsFromLocalStorage);
  const [generationPhase, setGenerationPhase] = useState<'idle' | 'prompting' | 'imaging'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<PageName>(PageName.WELCOME); // Start on the Welcome page
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  
  // No API key state or logic needed for free gemini-2.5-flash usage

  // Save designs to local storage whenever allDesigns changes
  useEffect(() => {
    try {
      localStorage.setItem('boothGenDesigns', JSON.stringify(allDesigns));
    } catch (error) {
      console.error("Failed to save designs to local storage:", error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        setError("Warning: Browser storage limit reached. Historical images cannot be saved. Please clear some history or reduce number of designs.");
      } else {
        setError("Failed to save design history due to a browser error.");
      }
    }
  }, [allDesigns]);

  const handleFullGenerate = async (requirements: BoothRequirements, logoFile: File | null) => {
    setError(null);
    setCurrentDesign(null); // Clear previous design when starting a new generation
    setGenerationPhase('prompting');

    try {
      let logoImagePart: { data: string; mimeType: string } | null = null;
      if (logoFile) {
        logoImagePart = await fileToBase64(logoFile);
      }

      // 1. Optimize Prompt (text model)
      const { imagePrompt, rationale } = await generateOptimizedPrompt(requirements);
      setGenerationPhase('imaging');
      
      // 2. Generate Image (image model)
      const imageUrl = await generateBoothImage(imagePrompt, logoImagePart);

      // 3. Set State
      const newDesign: GeneratedDesign = {
        id: Date.now().toString(),
        imageUrl, // Full image URL for current display
        promptUsed: imagePrompt,
        rationale,
        timestamp: Date.now(),
      };

      // Create a version for history storage (without the large image data)
      const designForHistory = { ...newDesign, imageUrl: null }; // Set imageUrl to null for history

      setCurrentDesign(newDesign); // Set current design with full image
      setAllDesigns(prevDesigns => [designForHistory, ...prevDesigns]); // Add lightweight design to history
      setCurrentPage(PageName.CONFIG); // Ensure we're on the config page to see the new design

    } catch (err: any) {
      console.error("Generation failed:", err);
      let errorMessage = "Failed to generate design. Please try again.";
      
      // Refined error handling for specific API errors
      if (err && err.error) {
        if (err.error.code === 500 || err.error.status === "INTERNAL") {
          errorMessage = "Oops! The AI server encountered an internal error. This is usually temporary. Please try again in a moment, or simplify your design inputs.";
        } else if (err.error.message) {
          errorMessage = `API Error: ${err.error.message}`;
        }
      } else if (err && err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setGenerationPhase('idle');
    }
  };

  const handleNavigate = (page: PageName) => {
    setCurrentPage(page);
    // Optionally clear currentDesign when navigating away from config, or keep it.
    // setCurrentDesign(null); 
  };

  const handleViewHistoryDesign = (design: GeneratedDesign) => {
    // When loading from history, the imageUrl might be null (due to storage limits).
    // We display the metadata, but the image will show a placeholder in DesignShowcase.
    setCurrentDesign(design);
    setCurrentPage(PageName.CONFIG); // Go back to config page to show the selected design
  };

  const handleRemoveDesign = (designId: string) => {
    setAllDesigns(prevDesigns => prevDesigns.filter(d => d.id !== designId));
    if (currentDesign && currentDesign.id === designId) {
      setCurrentDesign(null); // Clear if the currently displayed design is removed
    }
  };

  const handleClearAllDesigns = () => {
    if (window.confirm("Are you sure you want to clear all design history? This cannot be undone.")) {
      setAllDesigns([]);
      setCurrentDesign(null);
    }
  };

  const openImageModal = (imageUrl: string) => {
    setModalImageUrl(imageUrl);
    setIsModalOpen(true);
  };

  const closeImageModal = () => {
    setIsModalOpen(false);
    setModalImageUrl(null);
  };

  const isAnyGenerating = generationPhase !== 'idle';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 selection:bg-blue-500/30">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center justify-between animate-fade-in">
            <span className="text-red-200 text-sm font-medium">{error}</span>
            <button 
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300"
            >
                &times;
            </button>
          </div>
        )}

        {currentPage === PageName.WELCOME && (
          <WelcomePage onStartConfig={() => handleNavigate(PageName.CONFIG)} />
        )}

        {currentPage === PageName.CONFIG && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Controls */}
            <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24">
              <ConfigurationForm 
                  onFullGenerate={handleFullGenerate} 
                  isAnyGenerating={isAnyGenerating} 
              />
              
              {/* Tips Card */}
              <div className="mt-6 bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pro Tip</h4>
                  <p className="text-xs text-slate-500">
                      The more detailed your input, the better the AI can visualize your dream booth! Be specific with dimensions, materials, and features.
                      For best results with brand colors, use hex codes (e.g., #1E90FF).
                  </p>
              </div>
            </div>

            {/* Right Column: Visualization */}
            <div className="lg:col-span-8 xl:col-span-9 min-h-[600px]">
              <DesignShowcase 
                  design={currentDesign}
                  generationPhase={generationPhase}
                  openImageModal={openImageModal}
              />
            </div>
          </div>
        )}

        {currentPage === PageName.HISTORY && (
          <DesignHistory 
            designs={allDesigns}
            onViewDesign={handleViewHistoryDesign}
            onRemoveDesign={handleRemoveDesign}
            onClearAll={handleClearAllDesigns}
            openImageModal={openImageModal}
          />
        )}
      </main>

      {/* Full Screen Image Modal */}
      {isModalOpen && modalImageUrl && (
        <FullScreenImageModal 
          imageUrl={modalImageUrl} 
          onClose={closeImageModal} 
        />
      )}

      {/* Simple Footer */}
      <footer className="border-t border-slate-800 mt-12 py-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-slate-600 text-sm">
                Generated designs are for conceptual purposes only.
            </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
