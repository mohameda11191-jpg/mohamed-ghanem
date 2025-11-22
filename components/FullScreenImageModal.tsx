
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface FullScreenImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

const FullScreenImageModal: React.FC<FullScreenImageModalProps> = ({ imageUrl, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Full screen image view"
    >
      <div 
        ref={modalRef} 
        className="relative max-w-full max-h-full bg-slate-900 rounded-lg shadow-2xl flex items-center justify-center p-2"
        style={{ aspectRatio: '16/9' }} // Maintain aspect ratio if image is 16:9
      >
        <img 
          src={imageUrl} 
          alt="Full screen view of generated design" 
          className="max-w-full max-h-[90vh] object-contain rounded-lg" 
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-800/70 hover:bg-slate-700/80 text-white p-2 rounded-full transition-colors z-10"
          aria-label="Close full screen image"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default FullScreenImageModal;
