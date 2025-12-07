import React, { useState } from 'react';
import { Icons } from './Icons';

interface EditModalProps {
  photoUrl: string;
  onClose: () => void;
  onConfirmEdit: (prompt: string) => Promise<void>;
  isProcessing: boolean;
}

const EditModal: React.FC<EditModalProps> = ({ photoUrl, onClose, onConfirmEdit, isProcessing }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onConfirmEdit(prompt);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[80vh] md:h-[600px] animate-fade-in">
        
        {/* Preview Area */}
        <div className="flex-1 bg-gray-900 flex items-center justify-center relative p-4">
          <img 
            src={photoUrl} 
            alt="To edit" 
            className="max-h-full max-w-full object-contain rounded-lg shadow-lg" 
          />
          <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
            Original
          </div>
        </div>

        {/* Controls */}
        <div className="w-full md:w-96 bg-white p-6 flex flex-col justify-between border-l border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Icons.Wand className="w-5 h-5 text-purple-600" />
              Magic Editor
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Use AI to transform your image. Describe what you want to change, add, or remove.
            </p>

            <form onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Edit Instruction
              </label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., 'Add a retro filter', 'Make it snowy', 'Remove the background'"
                className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none transition-all mb-4"
                disabled={isProcessing}
              />
              
              <button 
                type="submit"
                disabled={!prompt.trim() || isProcessing}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Icons.Loader className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Icons.Wand className="w-4 h-4" /> Apply Magic
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <button 
              onClick={onClose}
              disabled={isProcessing}
              className="w-full py-2 text-gray-500 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModal;