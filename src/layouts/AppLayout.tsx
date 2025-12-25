import { useEffect, useReducer, useState } from 'react';
import Spotlight from '../components/global/Spotlight';
import MacToolbar from '../components/global/MacToolbar';
import MobileDock from '../components/global/MobileDock';
import DesktopDock from '../components/global/DesktopDock';
import NotesApp from '../components/global/NotesApp';
import PhotoAlbumPlayer from '../components/global/PhotoAlbumPlayer';
import ShortcutsOverlay from '../components/global/ShortcutsOverlay';
import MissionControl from '../components/global/MissionControl';
import ShortcutHint from '../components/global/ShortcutHint';

interface AppLayoutProps {
  initialBg: string;
  backgroundMap: Record<string, string>;
}

export default function Desktop({ initialBg, backgroundMap }: AppLayoutProps) {
  const [currentBg, setCurrentBg] = useState<string>(initialBg);
  const [albumUrl, setAlbumUrl] = useState<string | null>(null);
  type App = 'notes' | 'music' | 'photoAlbum';
  type State = { windows: Record<App, boolean> };
  type Action = { type: 'OPEN' | 'CLOSE' | 'TOGGLE'; app: App } | { type: 'CLOSE_ALL' };

  const reducer = (state: State, action: Action): State => {
    switch (action.type) {
      case 'OPEN':
        return { windows: { ...state.windows, [action.app]: true } };
      case 'CLOSE':
        return { windows: { ...state.windows, [action.app]: false } };
      case 'TOGGLE':
        return { windows: { ...state.windows, [action.app]: !state.windows[action.app] } };
      case 'CLOSE_ALL':
        return { windows: { notes: false, music: false, photoAlbum: false } };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, {
    windows: { notes: false, music: false, photoAlbum: false },
  });
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isMissionControlOpen, setIsMissionControlOpen] = useState(false);

  const activeApps = state.windows;

  useEffect(() => {
    const bgKeys = Object.keys(backgroundMap);
    
    // Ensure currentBg exists in backgroundMap, fallback to first available or initialBg
    if (bgKeys.length > 0 && !backgroundMap[currentBg]) {
      const fallbackBg = bgKeys[0] || initialBg;
      setCurrentBg(fallbackBg);
      localStorage.setItem('lastBackground', fallbackBg);
      return;
    } else if (bgKeys.length === 0) {
      // If no backgrounds available, clear currentBg
      setCurrentBg('');
      return;
    }

    const lastBg = localStorage.getItem('lastBackground');

    if (lastBg === initialBg && bgKeys.length > 1) {
      const availableBgs = bgKeys.filter((bg) => bg !== lastBg);
      if (availableBgs.length > 0) {
        const newBg = availableBgs[Math.floor(Math.random() * availableBgs.length)];
        setCurrentBg(newBg);
        localStorage.setItem('lastBackground', newBg);
        return;
      }
    }

    // Update localStorage with current background
    if (backgroundMap[currentBg]) {
      localStorage.setItem('lastBackground', currentBg);
    }
  }, [initialBg, backgroundMap]);

  // Spotlight keyboard shortcut (Cmd/Ctrl + K), help overlay (?), and Mission Control (Ctrl/Cmd+Up or F3)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (cmdOrCtrl && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSpotlightOpen(true);
      } else if (e.key === '?' || (e.key === '/' && e.shiftKey) || (cmdOrCtrl && (e.key === 'h' || e.key === 'H'))) {
        e.preventDefault();
        setShowShortcuts((s) => !s);
      } else if ((cmdOrCtrl && e.key === 'ArrowUp') || e.key === 'F3' || (cmdOrCtrl && (e.key === 'm' || e.key === 'M'))) {
        e.preventDefault();
        setIsMissionControlOpen((m) => !m);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Helper actions for Spotlight
  const openNotesSection = () => {
    handleAppOpen('notes');
  };
  const closeAllWindows = () => dispatch({ type: 'CLOSE_ALL' });
  const shuffleBackground = () => {
    const bgKeys = Object.keys(backgroundMap);
    if (bgKeys.length === 0) return;
    
    const availableBgs = bgKeys.filter((bg) => bg !== currentBg);
    if (availableBgs.length === 0) {
      // If only one background, just use it
      setCurrentBg(bgKeys[0]);
      localStorage.setItem('lastBackground', bgKeys[0]);
      return;
    }
    
    const newBg = availableBgs[Math.floor(Math.random() * availableBgs.length)];
    setCurrentBg(newBg);
    localStorage.setItem('lastBackground', newBg);
  };

  const handleAppOpen = (app: App) => dispatch({ type: 'OPEN', app });
  const handleAppClose = (app: App) => dispatch({ type: 'CLOSE', app });

  // Fetch app config from API
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/content/config');
        if (response.ok) {
          const data = await response.json();
          if (data?.photoAlbum?.albumUrl && typeof data.photoAlbum.albumUrl === 'string') {
            setAlbumUrl(data.photoAlbum.albumUrl);
          } else {
            setAlbumUrl(null);
          }
        } else {
          console.error('Failed to fetch config:', response.status, response.statusText);
          setAlbumUrl(null);
        }
      } catch (error) {
        console.error('Failed to fetch config:', error);
        setAlbumUrl(null);
      }
    };

    fetchConfig();
  }, []);

  // Get background URL with fallback
  const backgroundUrl = backgroundMap[currentBg] || backgroundMap[initialBg] || '';

  return (
    <div className='relative w-screen h-screen overflow-hidden'>
      {backgroundUrl && (
        <div
          className='absolute inset-0 bg-cover bg-center bg-no-repeat'
          style={{ backgroundImage: `url(${backgroundUrl})` }}
        />
      )}

      <div className='relative z-10'>
        <MacToolbar 
          onShowTutorial={() => {}}
          onOpenSpotlight={() => setIsSpotlightOpen(true)}
          onOpenMissionControl={() => setIsMissionControlOpen(true)}
          onToggleShortcuts={() => setShowShortcuts((s) => !s)}
          onCloseAllWindows={closeAllWindows}
          onShuffleBackground={shuffleBackground}
        />
      </div>

      <div className='relative z-0 flex items-center justify-center h-[calc(100vh-10rem)] md:h-[calc(100vh-1.5rem)] pt-6'>
      </div>

      <MobileDock
        onNotesClick={() => {
          handleAppOpen('notes');
        }}
        onPhotoAlbumClick={() => {
          handleAppOpen('photoAlbum');
        }}
      />
      <DesktopDock
        onNotesClick={() => {
          handleAppOpen('notes');
        }}
        onPhotoAlbumClick={() => {
          handleAppOpen('photoAlbum');
        }}
        activeApps={activeApps}
      />

      <NotesApp isOpen={state.windows.notes} onClose={() => {
        handleAppClose('notes');
      }} />
      <PhotoAlbumPlayer isOpen={state.windows.photoAlbum} onClose={() => {
        handleAppClose('photoAlbum');
      }} albumUrl={albumUrl} />
      <Spotlight
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        actions={{
          openNotes: () => handleAppOpen('notes'),
          openNotesSection: () => openNotesSection(),
          openPhotoAlbum: () => handleAppOpen('photoAlbum'),
          closeAllWindows,
          shuffleBackground,
        }}
      />
      <ShortcutsOverlay open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <ShortcutHint />
      <MissionControl
        isOpen={isMissionControlOpen}
        onClose={() => setIsMissionControlOpen(false)}
        activeApps={activeApps}
        onAppClick={(app) => handleAppOpen(app)}
        onAppClose={(app) => handleAppClose(app)}
      />
    </div>
  );
}
