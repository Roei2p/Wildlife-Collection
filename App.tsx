import React, { useState, useEffect } from 'react';
import { Icons } from './components/Icons';
import UploadModal from './components/UploadModal';
import AlbumCard from './components/AlbumCard';
import PhotoDetail from './components/PhotoDetail';
import { Album, AppState, Photo } from './types';
import { identifyCreature, generateQuickCaption, getSpeciesDetails } from './services/geminiService';

const App: React.FC = () => {
  // State
  const [state, setState] = useState<AppState>({
    albums: {},
    recentPhotos: []
  });
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('naturelens-data');
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('naturelens-data', JSON.stringify(state));
  }, [state]);

  const handleAnalyze = async (file: File) => {
    setIsAnalyzing(true);
    try {
      // 1. Convert to Base64
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      
      // Clean base64 string for API (remove data URL prefix)
      const base64Content = base64Data.split(',')[1];
      const mimeType = file.type;

      // 2. Identify (Gemini 3 Pro)
      const analysis = await identifyCreature(base64Content, mimeType);
      
      // 3. Generate Caption (Gemini 2.5 Flash Lite)
      const caption = await generateQuickCaption(analysis.species);

      const newPhoto: Photo = {
        id: Date.now().toString(),
        url: base64Data,
        timestamp: Date.now(),
        analysis,
        funCaption: caption
      };

      // 4. Sort into Album
      const speciesKey = analysis.species.toLowerCase().trim();
      
      setState(prev => {
        const existingAlbum = prev.albums[speciesKey];
        const newAlbums = { ...prev.albums };
        
        if (existingAlbum) {
          newAlbums[speciesKey] = {
            ...existingAlbum,
            photos: [newPhoto, ...existingAlbum.photos]
          };
        } else {
          newAlbums[speciesKey] = {
            id: speciesKey,
            name: analysis.species,
            coverPhotoUrl: base64Data,
            photos: [newPhoto]
          };
        }

        return {
          albums: newAlbums,
          recentPhotos: [newPhoto, ...prev.recentPhotos].slice(0, 10)
        };
      });

      setIsUploadOpen(false);
      // Auto open the album
      setSelectedAlbumId(speciesKey);

    } catch (error) {
      alert("Failed to identify image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAlbumSelect = async (albumId: string) => {
    setSelectedAlbumId(albumId);
    // Trigger ground search lazily if not present
    const album = state.albums[albumId];
    if (album && !album.wikiSummary && !loadingSearch) {
      setLoadingSearch(true);
      const details = await getSpeciesDetails(album.name);
      
      setState(prev => ({
        ...prev,
        albums: {
          ...prev.albums,
          [albumId]: {
            ...prev.albums[albumId],
            wikiSummary: details.summary,
            wikiUrl: details.url
          }
        }
      }));
      setLoadingSearch(false);
    }
  };

  const currentAlbum = selectedAlbumId ? state.albums[selectedAlbumId] : null;

  return (
    <div className="min-h-screen pb-20">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => setSelectedAlbumId(null)}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-lg flex items-center justify-center text-white">
            <Icons.Leaf className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-800 to-teal-600">
            NatureLens
          </h1>
        </div>
        
        <button 
          onClick={() => setIsUploadOpen(true)}
          className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-full font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm"
        >
          <Icons.Camera className="w-4 h-4" />
          <span className="hidden sm:inline">Identify Species</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        
        {!selectedAlbumId ? (
          /* Gallery View */
          <div className="space-y-10 animate-fade-in-up">
            <div className="text-center py-10">
               <h2 className="text-4xl font-extrabold text-emerald-950 mb-4">Your Wildlife Collection</h2>
               <p className="text-gray-500 max-w-xl mx-auto">
                 Upload photos of birds and animals. AI will identify them and sort them into albums automatically.
               </p>
            </div>

            {Object.keys(state.albums).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                  <Icons.Upload className="w-10 h-10 text-emerald-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700">No collection yet</h3>
                <p className="text-gray-400 mb-6">Start your journey by uploading a photo</p>
                <button 
                  onClick={() => setIsUploadOpen(true)}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all"
                >
                  Start Identifying
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Object.values(state.albums).map((album: Album) => (
                  <AlbumCard 
                    key={album.id} 
                    album={album} 
                    onClick={() => handleAlbumSelect(album.id)} 
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Album View */
          currentAlbum && (
            <div className="animate-fade-in">
              <button 
                onClick={() => setSelectedAlbumId(null)}
                className="mb-6 flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-medium transition-colors"
              >
                ← Back to Collection
              </button>
              
              <div className="bg-white rounded-3xl shadow-sm border border-emerald-50 overflow-hidden mb-8">
                <div className="relative h-64 md:h-80 w-full">
                   <img 
                     src={currentAlbum.coverPhotoUrl} 
                     className="w-full h-full object-cover" 
                     alt={currentAlbum.name}
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                   <div className="absolute bottom-6 left-6 md:left-10 text-white">
                      <h1 className="text-4xl md:text-5xl font-bold mb-2">{currentAlbum.name}</h1>
                      <div className="flex items-center gap-4 text-emerald-100 text-sm md:text-base">
                        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                          {currentAlbum.photos.length} sightings
                        </span>
                        {currentAlbum.photos[0]?.analysis.scientificName && (
                          <span className="italic font-mono opacity-80">
                            {currentAlbum.photos[0].analysis.scientificName}
                          </span>
                        )}
                      </div>
                   </div>
                </div>

                {/* Grounding Info Section */}
                <div className="p-6 md:p-10 bg-emerald-50/30">
                  <div className="max-w-4xl">
                     <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-900 mb-3">
                       <Icons.Info className="w-5 h-5 text-emerald-600" />
                       About this Species
                     </h3>
                     {loadingSearch ? (
                       <div className="flex items-center gap-2 text-gray-500">
                         <Icons.Loader className="w-4 h-4 animate-spin" /> Fetching latest info...
                       </div>
                     ) : (
                       <div className="prose prose-emerald">
                         <p className="text-gray-700 leading-relaxed">
                           {currentAlbum.wikiSummary || "No additional information available."}
                         </p>
                         {currentAlbum.wikiUrl && (
                           <a 
                             href={currentAlbum.wikiUrl} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-medium mt-3 text-sm"
                           >
                             Read more on Google Search <Icons.Link className="w-3 h-3" />
                           </a>
                         )}
                       </div>
                     )}
                  </div>
                </div>
              </div>

              {/* Photos Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentAlbum.photos.map(photo => (
                  <div 
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="group aspect-square relative cursor-pointer overflow-hidden rounded-xl bg-gray-100"
                  >
                    <img 
                      src={photo.url} 
                      alt={photo.analysis.species} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    {photo.funCaption && (
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                         <p className="text-white text-xs font-medium italic">"{photo.funCaption}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </main>

      {/* Modals */}
      {isUploadOpen && (
        <UploadModal 
          onClose={() => !isAnalyzing && setIsUploadOpen(false)} 
          onAnalyze={handleAnalyze} 
          isAnalyzing={isAnalyzing} 
        />
      )}

      {selectedPhoto && (
        <PhotoDetail 
          photo={selectedPhoto} 
          onClose={() => setSelectedPhoto(null)} 
        />
      )}
    </div>
  );
};

export default App;