import { useState, useEffect } from 'react';
import DraggableWindow from './DraggableWindow';

interface AppleMusicPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  playlistId?: string | null;
}

export default function AppleMusicPlayer({ isOpen, onClose, playlistId }: AppleMusicPlayerProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Extract playlist ID from URL if full URL is provided
  // Supports both formats: full URL or just the playlist ID
  const getPlaylistId = (idOrUrl: string | undefined | null): string => {
    // Handle undefined/null/empty values
    if (!idOrUrl || typeof idOrUrl !== 'string') {
      return '';
    }
    return idOrUrl;
  };

  if (!isOpen) return null;

  const embedPlaylistId = getPlaylistId(playlistId);

  return (
    <DraggableWindow
      title="Apple Music"
      onClose={onClose}
      initialPosition={{ 
        x: Math.floor(window.innerWidth * 0.1), 
        y: Math.floor(window.innerHeight * 0.2) 
      }}
      className={`w-[90%] max-w-md transition-all duration-300 ${isMinimized ? 'h-16' : 'h-[475px]'}`}
      initialSize={{ width: 800, height: 475 }}
    >
      <div className={`h-full transition-all duration-300 ${isMinimized ? 'hidden' : 'block'}`}>
        <iframe
          // Use the Apple Music embed domain - format: /us/playlist/[playlist-id]
          src={`https://embed.music.apple.com/us/playlist/${embedPlaylistId}`}
          width="100%"
          height="100%"
          style={{ maxWidth: '100%', overflow: 'hidden', borderRadius: '10px' }}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; xr-spatial-tracking"
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
          className="border-0"
          title="Apple Music player"
        />
      </div>
    </DraggableWindow>
  );
}

