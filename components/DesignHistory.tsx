
import React from 'react';
import { GeneratedDesign, PageName } from '../types';
import { History, Eye, Trash2, XCircle, ImageOff } from 'lucide-react'; // Added ImageOff

interface DesignHistoryProps {
  designs: GeneratedDesign[];
  onViewDesign: (design: GeneratedDesign) => void;
  onRemoveDesign: (designId: string) => void;
  onClearAll: () => void;
  openImageModal: (imageUrl: string) => void; // Added for full-screen view
}

const DesignHistory: React.FC<DesignHistoryProps> = ({ designs, onViewDesign, onRemoveDesign, onClearAll, openImageModal }) => {
  if (designs.length === 0) {
    return (
      <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-700 p-8 text-center">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <History className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">No Designs Yet</h3>
        <p className="text-slate-400 max-w-sm">
          Your generated booth designs will appear here. Navigate to "Configure New Design" to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <History className="w-6 h-6 mr-2 text-blue-500" />
          Design History
          <span className="ml-3 text-slate-500 text-base font-normal">({designs.length} designs)</span>
        </h2>
        {designs.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center text-red-400 hover:text-red-300 text-sm transition-colors"
            aria-label="Clear all design history"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear All History
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {designs.map((design) => (
          <div key={design.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg flex flex-col">
            <div className="relative aspect-video bg-slate-900 group">
              {design.imageUrl ? (
                <img
                  src={design.imageUrl}
                  alt={`Booth Design ${design.id}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                  onClick={() => openImageModal(design.imageUrl!)}
                  aria-label={`View design ${design.id} in full screen`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-700 text-slate-400 text-center p-4">
                  <div className="flex flex-col items-center">
                    <ImageOff className="w-8 h-8 mb-2" />
                    <span className="text-xs">Image not loaded (storage limit)</span>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button
                  onClick={() => onViewDesign(design)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-md transition-colors flex items-center space-x-2"
                  aria-label={`Load design ${design.id} into configuration`}
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
              </div>
              <button
                onClick={() => onRemoveDesign(design.id)}
                className="absolute top-2 right-2 text-slate-400 hover:text-red-400 bg-slate-900/70 p-1 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                title="Remove from history"
                aria-label={`Remove design ${design.id} from history`}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-grow">
              <p className="text-sm font-semibold text-white mb-2">Design Rationale:</p>
              <p className="text-slate-400 text-xs line-clamp-3">
                {design.rationale}
              </p>
            </div>
            <div className="px-4 pb-4 text-xs text-slate-500 border-t border-slate-700 pt-3 flex justify-between items-center">
              <span>Generated: {new Date(design.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DesignHistory;
