import React, { useState, useEffect } from 'react';
import { Icons } from './components/Icons';
import UploadModal from './components/UploadModal';
import StudioModal from './components/StudioModal';
import EditModal from './components/EditModal';
import AlbumCard from './components/AlbumCard';
import PhotoDetail from './components/PhotoDetail';
import { Album, AppState, Photo } from './types';
import { 
  identifyCreature, 
  generateQuickCaption, 
  getSpeciesDetails,
  generateWildlifeImage,
  editWildlifePhoto
} from './services/geminiService';

const backgroundImages = [
  "https://res.cloudinary.com/dn74u2shb/image/upload/v1741165150/1_fapx7y.png",
  "https://res.cloudinary.com/dn74u2shb/image/upload/v1741165147/2_aeqh6l.png",
  "https://res.cloudinary.com/dn74u2shb/image/upload/v1741165148/3_j62l8c.png",
  "https://res.cloudinary.com/dn74u2shb/image/upload/v1741165147/4_tq0qfv.png",
  "https://res.cloudinary.com/dn74u2shb/image/upload/v1741165149/5_r9g3y1.png"
];

const App: React.FC = () => {
  // State
  const [state, setState] = useState<AppState>({
    albums: {},
    recentPhotos: []
  });
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
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

  const processAndAddPhoto = async (
    base64Data: string, 
    mimeType: string,
    source: 'upload' | 'generated' | 'edited',
    overrideSpecies?: string
  ) => {
    // 1. Identify (Gemini 3 Pro) - Reuse identification logic even for generated/edited images to auto-categorize
    const analysis = await identifyCreature(base64Data, mimeType);
    
    // 2. Generate Caption (Gemini 2.5 Flash Lite)
    const caption = await generateQuickCaption(analysis.species);

    const newPhoto: Photo = {
      id: Date.now().toString(),
      url: `data:${mimeType};base64,${base64Data}`,
      timestamp: Date.now(),
      analysis,
      funCaption: caption,
      source
    };

    // 3. Sort into Album
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
          coverPhotoUrl: `data:${mimeType};base64,${base64Data}`,
          photos: [newPhoto]
        };
      }

      return {
        albums: newAlbums,
        recentPhotos: [newPhoto, ...prev.recentPhotos].slice(0, 10)
      };
    });

    return { speciesKey, newPhoto };
  };

  const handleAnalyze = async (file: File) => {
    setIsProcessing(true);
    try {
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      
      const base64Content = base64Data.split(',')[1];
      const result = await processAndAddPhoto(base64Content, file.type, 'upload');

      setIsUploadOpen(false);
      setSelectedAlbumId(result.speciesKey);
    } catch (error) {
      alert("Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerate = async (prompt: string, aspectRatio: string, size: string) => {
    setIsProcessing(true);
    try {
      const base64Image = await generateWildlifeImage(prompt, aspectRatio, size);
      // Generated images are PNG usually
      const result = await processAndAddPhoto(base64Image, 'image/png', 'generated');
      
      setIsStudioOpen(false);
      setSelectedAlbumId(result.speciesKey);
      setSelectedPhoto(result.newPhoto);
    } catch (error) {
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = async (prompt: string) => {
    if (!selectedPhoto) return;
    setIsProcessing(true);
    try {
      const base64Original = selectedPhoto.url.split(',')[1];
      const mimeType = selectedPhoto.url.split(';')[0].split(':')[1];
      
      const editedBase64 = await editWildlifePhoto(base64Original, mimeType, prompt);
      const result = await processAndAddPhoto(editedBase64, 'image/png', 'edited');

      setIsEditOpen(false);
      setSelectedPhoto(result.newPhoto); // Switch to view new photo
    } catch (error) {
      alert("Failed to edit image. Try a different prompt.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAlbumSelect = async (albumId: string) => {
    setSelectedAlbumId(albumId);
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
    <div className="min-h-screen pb-20 relative">
      {/* Animated Background */}
      <div className="bg-slideshow">
        {backgroundImages.map((src, index) => (
          <img key={index} src={src} className="slide-img" alt="" />
        ))}
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm px-6 py-4 flex justify-between items-center">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => setSelectedAlbumId(null)}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-lg flex items-center justify-center text-white shadow-md">
            <Icons.Library className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-800 to-teal-600 hidden sm:block">
            NatureLens
          </h1>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setIsStudioOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm"
          >
            <Icons.Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Studio</span>
          </button>
          <button 
            onClick={() => setIsUploadOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm"
          >
            <Icons.Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Add Photo</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 relative z-10">
        
        {!selectedAlbumId ? (
          /* Gallery View */
          <div className="space-y-10 animate-fade-in-up">
            <div className="text-center py-10 bg-white/60 backdrop-blur-sm rounded-3xl shadow-sm border border-white/50">
               <h2 className="text-4xl font-extrabold text-emerald-950 mb-4">Your Digital Wildlife Album</h2>
               <p className="text-gray-700 max-w-xl mx-auto font-medium">
                 Identify species, generate art, and curate your collection with AI.
               </p>
            </div>

            {Object.keys(state.albums).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white/80 backdrop-blur-md rounded-3xl border border-dashed border-emerald-300 shadow-lg">
                <div className="flex gap-4 mb-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce delay-100">
                    <Icons.Upload className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center animate-bounce delay-300">
                    <Icons.Palette className="w-8 h-8 text-indigo-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Start Your Collection</h3>
                <p className="text-gray-500 mb-6">Upload a photo or generate one using AI</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsUploadOpen(true)}
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md transition-all"
                  >
                    Upload Photo
                  </button>
                  <button 
                    onClick={() => setIsStudioOpen(true)}
                    className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold shadow-md transition-all"
                  >
                    Generate Art
                  </button>
                </div>
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
                className="mb-6 flex items-center gap-2 text-gray-700 bg-white/50 hover:bg-white px-4 py-2 rounded-full font-medium transition-all shadow-sm backdrop-blur-sm"
              >
                ← Back to Albums
              </button>
              
              <div className="bg-white rounded-3xl shadow-xl border border-emerald-50 overflow-hidden mb-8">
                <div className="relative h-64 md:h-80 w-full group">
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
                          {currentAlbum.photos.length} photos
                        </span>
                        {currentAlbum.photos[0]?.analysis.scientificName && (
                          <span className="italic font-mono opacity-80">
                            {currentAlbum.photos[0].analysis.scientificName}
                          </span>
                        )}
                      </div>
                   </div>
                </div>

                <div className="p-6 md:p-10 bg-emerald-50/50">
                  <div className="max-w-4xl">
                     <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-900 mb-3">
                       <Icons.Info className="w-5 h-5 text-emerald-600" />
                       About this {currentAlbum.photos[0]?.analysis.category || 'Species'}
                     </h3>
                     {loadingSearch ? (
                       <div className="flex items-center gap-2 text-gray-500">
                         <Icons.Loader className="w-4 h-4 animate-spin" /> Fetching details...
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
                    className="group aspect-square relative cursor-pointer overflow-hidden rounded-xl bg-white shadow-md hover:shadow-xl transition-all"
                  >
                    <img 
                      src={photo.url} 
                      alt={photo.analysis.species} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    
                    {photo.source === 'generated' && (
                      <div className="absolute top-2 right-2 bg-indigo-500 text-white p-1 rounded-md shadow-sm">
                        <Icons.Sparkles className="w-3 h-3" />
                      </div>
                    )}
                    {photo.source === 'edited' && (
                      <div className="absolute top-2 right-2 bg-purple-500 text-white p-1 rounded-md shadow-sm">
                        <Icons.Wand className="w-3 h-3" />
                      </div>
                    )}

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
          onClose={() => !isProcessing && setIsUploadOpen(false)} 
          onAnalyze={handleAnalyze} 
          isAnalyzing={isProcessing} 
        />
      )}

      {isStudioOpen && (
        <StudioModal
          onClose={() => !isProcessing && setIsStudioOpen(false)}
          onGenerate={handleGenerate}
          isGenerating={isProcessing}
        />
      )}

      {selectedPhoto && !isEditOpen && (
        <PhotoDetail 
          photo={selectedPhoto} 
          onClose={() => setSelectedPhoto(null)}
          onEdit={() => setIsEditOpen(true)} 
        />
      )}

      {isEditOpen && selectedPhoto && (
        <EditModal
          photoUrl={selectedPhoto.url}
          onClose={() => setIsEditOpen(false)}
          onConfirmEdit={handleEdit}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};

export default App;