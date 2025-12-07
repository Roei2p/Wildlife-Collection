import React from 'react';
import { Photo } from '../types';
import { Icons } from './Icons';

interface PhotoDetailProps {
  photo: Photo;
  onClose: () => void;
  onEdit: () => void;
}

const PhotoDetail: React.FC<PhotoDetailProps> = ({ photo, onClose, onEdit }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-50"
      >
        <Icons.X className="w-8 h-8" />
      </button>

      <div className="flex flex-col md:flex-row w-full max-w-6xl h-[90vh] bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Image Side */}
        <div className="flex-1 bg-black flex items-center justify-center relative group">
          <img 
            src={photo.url} 
            alt={photo.analysis.species} 
            className="max-h-full max-w-full object-contain"
          />
          {photo.source === 'generated' && (
            <div className="absolute top-4 left-4 bg-indigo-500/90 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm shadow-sm flex items-center gap-1">
              <Icons.Sparkles className="w-3 h-3" /> AI Generated
            </div>
          )}
        </div>

        {/* Info Side */}
        <div className="w-full md:w-[400px] bg-white text-gray-800 overflow-y-auto flex flex-col">
          <div className="p-8">
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wide">
                <Icons.Leaf className="w-3 h-3" />
                {photo.analysis.confidence > 0.8 ? 'Verified' : 'Possible'}
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wide">
                {photo.analysis.category || 'Wildlife'}
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-1">{photo.analysis.species}</h2>
            <p className="text-emerald-600 font-mono italic mb-6 text-lg">{photo.analysis.scientificName}</p>

            {photo.funCaption && (
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6 rounded-r-lg">
                <p className="text-orange-800 font-medium font-serif italic">"{photo.funCaption}"</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{photo.analysis.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Habitat</h3>
                <p className="text-gray-700 leading-relaxed flex items-start gap-2">
                  <Icons.MapPin className="w-4 h-4 mt-1 text-gray-400 flex-shrink-0" />
                  {photo.analysis.habitat}
                </p>
              </div>
            </div>
            
            <div className="mt-10 pt-6 border-t border-gray-100">
               <button 
                 onClick={onEdit}
                 className="w-full py-3 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 font-bold flex items-center justify-center gap-2 hover:bg-purple-100 transition-colors shadow-sm"
               >
                 <Icons.Wand className="w-4 h-4" />
                 Magic Editor
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoDetail;