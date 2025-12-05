import React, { useState, useRef } from 'react';
import { Icons } from './Icons';

interface UploadModalProps {
  onClose: () => void;
  onAnalyze: (file: File) => Promise<void>;
  isAnalyzing: boolean;
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onAnalyze, isAnalyzing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (selectedFile) {
      await onAnalyze(selectedFile);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-fade-in-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50/50">
          <h2 className="text-xl font-semibold text-emerald-900 flex items-center gap-2">
            <Icons.Camera className="w-5 h-5 text-emerald-600" />
            Add Sighting
          </h2>
          <button 
            onClick={onClose} 
            disabled={isAnalyzing}
            className="p-1 hover:bg-emerald-100 rounded-full transition-colors text-gray-500 hover:text-emerald-700"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!preview ? (
            <div 
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ${
                dragActive 
                  ? 'border-emerald-500 bg-emerald-50 scale-[1.02]' 
                  : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
              }`}
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={inputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleChange}
              />
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.Upload className="w-8 h-8" />
              </div>
              <p className="text-lg font-medium text-gray-700">Click or drag photo here</p>
              <p className="text-sm text-gray-500 mt-1">Supports JPG, PNG, WEBP</p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden shadow-md aspect-video bg-gray-100">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                  <Icons.Loader className="w-10 h-10 animate-spin mb-3" />
                  <p className="font-medium text-lg">Identifying Species...</p>
                  <p className="text-sm opacity-80">Using Gemini Vision Pro</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
           <button 
             onClick={() => { setPreview(null); setSelectedFile(null); }}
             disabled={isAnalyzing}
             className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
           >
             Reset
           </button>
           <button 
             onClick={handleSubmit}
             disabled={!selectedFile || isAnalyzing}
             className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
           >
             {isAnalyzing ? 'Analyzing...' : 'Analyze & Sort'}
             {!isAnalyzing && <Icons.Search className="w-4 h-4" />}
           </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;