import React from 'react';
import { Album } from '../types';
import { Icons } from './Icons';

interface AlbumCardProps {
  album: Album;
  onClick: () => void;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group relative cursor-pointer bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-emerald-200"
    >
      {/* Cover Image Area */}
      <div className="h-48 w-full overflow-hidden bg-gray-200 relative">
        {album.coverPhotoUrl ? (
          <img 
            src={album.coverPhotoUrl} 
            alt={album.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <Icons.Library className="w-12 h-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
        
        {/* Count Badge */}
        <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-full border border-white/20">
          {album.photos.length} {album.photos.length === 1 ? 'Photo' : 'Photos'}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800 group-hover:text-emerald-700 transition-colors truncate">
          {album.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
           {album.photos[0]?.analysis.scientificName || "Unknown Species"}
        </p>
      </div>
    </div>
  );
};

export default AlbumCard;