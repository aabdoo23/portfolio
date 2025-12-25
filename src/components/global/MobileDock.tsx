import { useState, useEffect } from 'react';
import appleNotesIcon from '../../assets/images/apple-notes.svg?url';
import applePhotosIcon from '../../assets/images/apple-photos.svg?url';
import appleMusicIcon from '../../assets/images/apple-music.svg?url';

interface MobileDockProps {
  onNotesClick: () => void;
  onPhotoAlbumClick: () => void;
}

export default function MobileDock({ onNotesClick, onPhotoAlbumClick }: MobileDockProps) {
  const [playlistId, setPlaylistId] = useState<string | null>(null);

  // Fetch app config from API
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/content/config');
        if (response.ok) {
          const data = await response.json();
          if (data?.music?.playlistId && typeof data.music.playlistId === 'string') {
            setPlaylistId(data.music.playlistId);
          } else {
            setPlaylistId(null);
          }
        } else {
          console.error('Failed to fetch config:', response.status, response.statusText);
          setPlaylistId(null);
        }
      } catch (error) {
        console.error('Failed to fetch config:', error);
        setPlaylistId(null);
      }
    };

    fetchConfig();
  }, []);

  const handleAppleMusicClick = () => {
    if (playlistId) {
      window.open(playlistId, '_blank');
    }
  };

  return (
    <div className='fixed bottom-0 left-0 right-0 md:hidden flex flex-col items-center z-10 space-y-2' role="navigation" aria-label="Mobile dock">
      {/* Top row: viewer icons */}
      <div className='mx-4 mb-4 p-3 rounded-3xl space-x-4 flex justify-around items-center max-w-[400px] mx-auto' role="toolbar" aria-label="Apps">
        <button
          onClick={onNotesClick}
          aria-label='Open Notes'
          className='flex flex-col items-center cursor-pointer'
        >
          <div className='w-18 h-18 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-2xl overflow-hidden'>
            <img 
              src={appleNotesIcon} 
              alt="Notes"
              className="w-full h-full"
            />
          </div>
        </button>
        <button
          onClick={onPhotoAlbumClick}
          aria-label='Open Photos'
          className='flex flex-col items-center cursor-pointer'
        >
          <div className='w-18 h-18 bg-gradient-to-t from-purple-600 to-purple-400 rounded-2xl overflow-hidden'>
            <img 
              src={applePhotosIcon} 
              alt="Photos"
              className="w-full h-full"
            />
          </div>
        </button>
      </div>
    </div>
  );
}
