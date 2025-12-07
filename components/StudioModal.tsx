import React, { useState } from 'react';
import { Icons } from './Icons';

interface StudioModalProps {
  onClose: () => void;
  onGenerate: (prompt: string, aspectRatio: string, size: string) => Promise<void>;
  isGenerating: boolean;
}

const ASPECT_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"];
const IMAGE_SIZES = ["1K", "2K", "4K"];

const StudioModal: React.FC<StudioModalProps> = ({ onClose, onGenerate, isGenerating }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [size, setSize] = useState('1K');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt, aspectRatio, size);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
            <Icons.Palette className="w-5 h-5 text-indigo-600" />
            Creative Studio
          </h2>
          <button onClick={onClose} disabled={isGenerating} className="p-1 hover:bg-white/50 rounded-full text-indigo-400 hover:text-indigo-700 transition-colors">
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe a wildlife scene (e.g., 'A majestic lion resting on a rock at sunset, photorealistic')"
              className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none transition-all"
              disabled={isGenerating}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Aspect Ratio</label>
              <div className="grid grid-cols-4 gap-2">
                {ASPECT_RATIOS.map(ratio => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    disabled={isGenerating}
                    className={`py-2 px-1 text-sm rounded-lg border transition-all ${
                      aspectRatio === ratio
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Image Size</label>
              <div className="flex gap-2">
                {IMAGE_SIZES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    disabled={isGenerating}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-all ${
                      size === s
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Higher resolutions (2K/4K) may take longer to generate.
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
             <button
               type="button"
               onClick={onClose}
               disabled={isGenerating}
               className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
             >
               Cancel
             </button>
             <button
               type="submit"
               disabled={!prompt.trim() || isGenerating}
               className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
             >
               {isGenerating ? (
                 <>
                   <Icons.Loader className="w-4 h-4 animate-spin" /> Generating...
                 </>
               ) : (
                 <>
                   <Icons.Sparkles className="w-4 h-4" /> Generate Art
                 </>
               )}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudioModal;