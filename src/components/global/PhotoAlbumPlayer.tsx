import { useState, useEffect, useRef } from 'react';
import DraggableWindow from './DraggableWindow';
import { FaChevronLeft, FaChevronRight, FaTimes, FaSearch, FaPlay } from 'react-icons/fa';

interface MediaItem {
  url: string;
  isVideo: boolean;
  thumbnail?: string;
}

interface PhotoAlbumProps {
  isOpen: boolean;
  onClose: () => void;
  albumUrl: string | null;
}

export default function PhotoAlbumPlayer({ isOpen, onClose, albumUrl }: PhotoAlbumProps) {
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Filter photos based on search
  const filteredPhotos = photos.filter((item) => {
    if (!searchQuery) return true;
    return item.url.toLowerCase().includes(searchQuery.toLowerCase());
  });

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setPhotos([]);
    setSelectedPhotoIndex(null);
    setIsFullScreen(false);
    setZoomLevel(1);
    setSearchQuery('');
    setVisibleItems(new Set());

    if (!albumUrl) {
      setError('Album URL not configured');
      setLoading(false);
      return;
    }

    const fetchAlbum = async () => {
      try {
        const response = await fetch('/api/photo-album', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ albumUrl }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch album: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.photos || !Array.isArray(data.photos) || data.photos.length === 0) {
          throw new Error('No photos found in album');
        }

        // Convert to MediaItem format if needed (backward compatibility)
        const mediaItems: MediaItem[] = data.photos.map((item: any) => {
          if (typeof item === 'string') {
            // Old format: just a URL string
            return { url: item, isVideo: false };
          }
          // New format: object with url and isVideo
          return {
            url: item.url,
            isVideo: item.isVideo || false,
            thumbnail: item.thumbnail
          };
        });

        setPhotos(mediaItems);
        setLoading(false);
      } catch (err: any) {
        console.error("Failed to fetch iCloud photos", err);
        setError(typeof err === 'string' ? err : err?.message || 'Unknown error');
        setLoading(false);
      }
    };
    fetchAlbum();
  }, [isOpen, albumUrl]);

  // Intersection Observer for lazy loading images
  useEffect(() => {
    if (!isOpen || loading || filteredPhotos.length === 0) {
      setVisibleItems(new Set());
      return;
    }

    // Create intersection observer for lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
            setVisibleItems((prev) => new Set([...prev, index]));
            // Unobserve once loaded
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before item comes into view
        threshold: 0.01
      }
    );

    // Observe all grid items after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const gridItems = document.querySelectorAll('[data-lazy-item]');
      gridItems.forEach((item) => observerRef.current?.observe(item));
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isOpen, loading, filteredPhotos.length]);

  // Keyboard navigation for full-screen viewer
  useEffect(() => {
    if (!isOpen || !isFullScreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullScreen(false);
        setSelectedPhotoIndex(null);
        setZoomLevel(1);
      } else if (e.key === 'ArrowLeft' && selectedPhotoIndex !== null) {
        e.preventDefault();
        const prevIndex = selectedPhotoIndex > 0 ? selectedPhotoIndex - 1 : filteredPhotos.length - 1;
        setSelectedPhotoIndex(prevIndex);
        setZoomLevel(1);
      } else if (e.key === 'ArrowRight' && selectedPhotoIndex !== null) {
        e.preventDefault();
        const nextIndex = selectedPhotoIndex < filteredPhotos.length - 1 ? selectedPhotoIndex + 1 : 0;
        setSelectedPhotoIndex(nextIndex);
        setZoomLevel(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullScreen, selectedPhotoIndex, filteredPhotos.length]);

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || selectedPhotoIndex === null) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        // Swipe left - next photo
        const nextIndex = selectedPhotoIndex < filteredPhotos.length - 1 ? selectedPhotoIndex + 1 : 0;
        setSelectedPhotoIndex(nextIndex);
      } else {
        // Swipe right - previous photo
        const prevIndex = selectedPhotoIndex > 0 ? selectedPhotoIndex - 1 : filteredPhotos.length - 1;
        setSelectedPhotoIndex(prevIndex);
      }
      setZoomLevel(1);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
    setIsFullScreen(true);
    setZoomLevel(1);
    setIsPlayingVideo(false);
  };

  const handleCloseFullScreen = () => {
    setIsFullScreen(false);
    setSelectedPhotoIndex(null);
    setZoomLevel(1);
    setIsPlayingVideo(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleNextPhoto = () => {
    if (selectedPhotoIndex === null) return;
    const nextIndex = selectedPhotoIndex < filteredPhotos.length - 1 ? selectedPhotoIndex + 1 : 0;
    setSelectedPhotoIndex(nextIndex);
    setZoomLevel(1);
    setIsPlayingVideo(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handlePrevPhoto = () => {
    if (selectedPhotoIndex === null) return;
    const prevIndex = selectedPhotoIndex > 0 ? selectedPhotoIndex - 1 : filteredPhotos.length - 1;
    setSelectedPhotoIndex(prevIndex);
    setZoomLevel(1);
    setIsPlayingVideo(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  if (!isOpen) return null;

  const currentPhoto: MediaItem | null = selectedPhotoIndex !== null && selectedPhotoIndex < filteredPhotos.length 
    ? filteredPhotos[selectedPhotoIndex] 
    : null;

  return (
    <>
      <DraggableWindow
        title="Photos"
        onClose={onClose}
        initialPosition={{ x: 100, y: 100 }}
        initialSize={{ width: 1000, height: 700 }}
        className="w-[95vw] md:max-w-6xl max-h-[90vh] flex flex-col"
      >
        <div className="flex flex-col h-full bg-white overflow-hidden">
          {/* iOS-style Toolbar */}
          <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
            <div className="flex items-center gap-3 flex-1">
              <h1 className="text-lg font-semibold text-gray-900">Photos</h1>
              {filteredPhotos.length > 0 && (
                <span className="text-sm text-gray-500">
                  {filteredPhotos.length} {filteredPhotos.length === 1 ? 'photo' : 'photos'}
                </span>
              )}
            </div>
            <div className="relative w-64">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-100 text-gray-900 text-sm rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-500 text-sm">Loading photos...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-8">
                <div className="text-red-500 font-semibold text-lg">Unable to Load Photos</div>
                <div className="text-gray-500 text-sm text-center max-w-md">{error}</div>
                {albumUrl && (
                <a
                  href={albumUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 text-blue-500 text-sm underline"
                >
                  Open in iCloud Photos
                </a>
                )}
              </div>
            ) : filteredPhotos.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-400 text-lg mb-2">
                    {searchQuery ? 'No photos found' : 'No photos in album'}
                  </p>
                  {searchQuery && (
                    <p className="text-gray-400 text-sm">Try a different search term</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1">
                  {filteredPhotos.map((item, index) => {
                    const isVisible = visibleItems.has(index);
                    const shouldLoad = isVisible || index < 12; // Load first 12 immediately
                    
                    return (
                      <button
                        key={`${item.url}-${index}`}
                        data-lazy-item
                        data-index={index}
                        onClick={() => handlePhotoClick(index)}
                        className="group relative aspect-square overflow-hidden bg-gray-200 rounded-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {shouldLoad ? (
                          <>
                            <img
                              src={item.thumbnail || item.url}
                              alt={item.isVideo ? `Video ${index + 1}` : `Photo ${index + 1}`}
                              className="w-full h-full object-cover"
                              loading={index < 12 ? "eager" : "lazy"}
                              decoding="async"
                              onError={(e) => {
                                // If image fails to load, try the main URL as fallback
                                if (item.thumbnail && (e.target as HTMLImageElement).src !== item.url) {
                                  (e.target as HTMLImageElement).src = item.url;
                                }
                              }}
                            />
                            {item.isVideo && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                                  <FaPlay className="text-gray-900 ml-1" size={20} />
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full bg-gray-300 animate-pulse flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </DraggableWindow>

      {/* iOS-style Full Screen Viewer */}
      {isFullScreen && currentPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          onClick={handleCloseFullScreen}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between px-4 z-10">
            <button
              onClick={handleCloseFullScreen}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-sm"
              aria-label="Close"
            >
              <FaTimes />
            </button>
            {filteredPhotos.length > 1 && (
              <div className="text-white text-sm font-medium">
                {selectedPhotoIndex !== null ? selectedPhotoIndex + 1 : 0} of {filteredPhotos.length}
              </div>
            )}
            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* Navigation Buttons */}
          {filteredPhotos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevPhoto();
                }}
                className="absolute left-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-sm"
                aria-label="Previous photo"
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextPhoto();
                }}
                className="absolute right-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-sm"
                aria-label="Next photo"
              >
                <FaChevronRight />
              </button>
            </>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center gap-4 z-10">
            <div
              className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleZoomOut}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full text-white text-sm flex items-center justify-center"
                aria-label="Zoom out"
              >
                −
              </button>
              <span className="text-white text-sm min-w-[3rem] text-center font-medium">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full text-white text-sm flex items-center justify-center"
                aria-label="Zoom in"
              >
                +
              </button>
            </div>
          </div>

          {/* Photo or Video */}
          <div
            className="max-w-[95vw] max-h-[95vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {currentPhoto.isVideo ? (
              <div className="relative max-w-full max-h-[95vh]">
                {!isPlayingVideo ? (
                  <div className="relative">
                    <img
                      src={currentPhoto.thumbnail || currentPhoto.url}
                      alt="Video thumbnail"
                      className="max-w-full max-h-[95vh] object-contain select-none"
                      style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out' }}
                      draggable={false}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPlayingVideo(true);
                        setTimeout(() => {
                          videoRef.current?.play();
                        }, 100);
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                      aria-label="Play video"
                    >
                      <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                        <FaPlay className="text-gray-900 ml-2" size={30} />
                      </div>
                    </button>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    src={currentPhoto.url}
                    controls
                    autoPlay
                    className="max-w-full max-h-[95vh] object-contain"
                    onEnded={() => setIsPlayingVideo(false)}
                    onError={(e) => {
                      console.error('Video playback error:', e);
                      setIsPlayingVideo(false);
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            ) : (
              <img
                src={currentPhoto.url}
                alt="Photo"
                className="max-w-full max-h-[95vh] object-contain select-none"
                style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out' }}
                draggable={false}
                onError={(e) => {
                  console.error('Image failed to load:', currentPhoto.url);
                }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
