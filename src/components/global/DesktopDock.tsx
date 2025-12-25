import { useState, useEffect, useRef } from 'react';
import AppleMusicPlayer from './AppleMusicPlayer';
import appleNotesIcon from '../../assets/images/apple-notes.svg?url';
import applePhotosIcon from '../../assets/images/apple-photos.svg?url';
import appleMusicIcon from '../../assets/images/apple-music.svg?url';

interface DesktopDockProps {
  onNotesClick: () => void;
  onPhotoAlbumClick: () => void;
  activeApps: {
    notes: boolean;
    music: boolean;
    photoAlbum: boolean;
  };
}

const DesktopDock = ({ onNotesClick, onPhotoAlbumClick, activeApps }: DesktopDockProps) => {
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  const [showAppleMusic, setShowAppleMusic] = useState(false);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

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
    setShowAppleMusic(true);
  };

  const handleCloseAppleMusic = () => {
    setShowAppleMusic(false);
  };

  useEffect(() => {

    const handleMouseMove = (e: MouseEvent) => {
      if (dockRef.current) {
        const rect = dockRef.current.getBoundingClientRect();
        if (e.clientY >= rect.top - 50 && e.clientY <= rect.bottom + 50) {
          setMouseX(e.clientX);
        } else {
          setMouseX(null);
        }
      }
    };

    const handleMouseLeave = () => {
      setMouseX(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const calculateScale = (iconIndex: number, totalIcons: number) => {
    if (mouseX === null || !dockRef.current) return 1;
    const rect = dockRef.current.getBoundingClientRect();
    const iconWidth = rect.width / totalIcons;
    const iconCenter = rect.left + iconIndex * iconWidth + iconWidth / 2;
    const distance = Math.abs(mouseX - iconCenter);
    const maxDistance = iconWidth * 2;
    if (distance > maxDistance) return 1;
    const proximity = 1 - distance / maxDistance;
    return 1 + proximity * 0.4; // Scale up to 1.4x
  };

  const Tooltip = ({ text }: { text: string }) => (
    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-sm whitespace-nowrap">
      {text}
    </div>
  );

  const icons = [
    { id: 'notes', label: 'Notes', onClick: onNotesClick, iconSvg: appleNotesIcon, color: 'from-yellow-600 to-yellow-400', active: activeApps.notes },
    { id: 'photoAlbum', label: 'Photos', onClick: onPhotoAlbumClick, iconSvg: applePhotosIcon, color: 'from-white-600 to-white-400', active: activeApps.photoAlbum },
    { id: 'music', label: 'Apple Music', onClick: handleAppleMusicClick, iconSvg: appleMusicIcon, color: 'from-pink-600 to-pink-400', active: activeApps.music },
  ] as Array<{
    id: string;
    label: string;
    onClick: () => void;
    color: string;
    active: boolean;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
    iconSvg?: string;
  }>;

  return (
    <>
      <nav aria-label="Dock" className="fixed bottom-0 left-0 right-0 hidden md:flex justify-center pb-4 z-100">
        <div ref={dockRef} className="bg-gray-600/50 backdrop-blur-sm rounded-2xl p-2 shadow-xl">
          <div className="flex space-x-2" role="menubar">
            {icons.map((item, index) => {
              const Icon = item.icon;
              const scale = calculateScale(index, icons.length);
              const hasSvg = item.iconSvg !== undefined;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  aria-label={item.label}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.onClick(); } }}
                  onMouseEnter={() => setHoveredIcon(item.id)}
                  onMouseLeave={() => setHoveredIcon(null)}
                  className="relative group"
                  style={{ transform: `scale(${scale})`, transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  <div className={`relative w-12 h-12 bg-gradient-to-t ${item.color} rounded-xl shadow-lg active:scale-95 ${item.active ? 'ring-2 ring-white/50' : ''} ${hasSvg ? 'overflow-hidden' : 'flex items-center justify-center'}`}>
                    {hasSvg && item.iconSvg ? (
                      <img 
                        src={item.iconSvg} 
                        alt={item.label}
                        className="w-full h-full"
                      />
                    ) : Icon ? (
                      <Icon size={35} className='text-white' />
                    ) : null}
                    {item.active && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full" aria-hidden="true" />}
                  </div>
                  {hoveredIcon === item.id && <Tooltip text={item.label} />}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <AppleMusicPlayer
        isOpen={showAppleMusic}
        onClose={handleCloseAppleMusic}
        playlistId={playlistId}
      />
    </>
  );
};

export default DesktopDock;
