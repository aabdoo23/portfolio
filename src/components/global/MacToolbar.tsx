import { useState, useEffect, useRef } from 'react';
import { MdWifi } from 'react-icons/md';
import { FaApple, FaWindowRestore } from 'react-icons/fa';
import {
  IoSearchSharp,
  IoBatteryHalfOutline,
  IoCellular,
  IoDocumentText,
  IoHelpCircle,
} from 'react-icons/io5';
import { VscVscode } from 'react-icons/vsc';

type MenuItem = {
  label: string;
  icon?: React.ReactNode;
  action?: () => void;
  submenu?: MenuItem[];
};

interface MacToolbarProps {
  onShowTutorial?: () => void;
  onOpenSpotlight?: () => void;
  onOpenMissionControl?: () => void;
  onToggleShortcuts?: () => void;
  onCloseAllWindows?: () => void;
  onShuffleBackground?: () => void;
}

export default function MacToolbar({
  onShowTutorial,
  onOpenSpotlight,
  onOpenMissionControl,
  onToggleShortcuts,
  onCloseAllWindows,
  onShuffleBackground,
}: MacToolbarProps) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatMacDate = (date: Date) => {
    const weekday = date.toLocaleString('en-US', { weekday: 'short' });
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    const hour = date.toLocaleString('en-US', {
      hour: 'numeric',
      hour12: true,
    });
    const minute = date.getMinutes().toString().padStart(2, '0');
    const period = date.getHours() >= 12 ? 'PM' : 'AM';

    return `${weekday} ${month} ${day} ${hour.replace(
      /\s?[AP]M/,
      ''
    )}:${minute} ${period}`;
  };

  const formatIPhoneTime = (date: Date) => {
    let hour = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, '0');

    hour = hour % 12;
    hour = hour ? hour : 12;

    return `${hour}:${minute}`;
  };

  const handleVSCodeClick = () => {
    window.location.href = 'vscode:/';
  };

  const handleMenuClick = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleAction = (action?: () => void) => {
    if (action) {
      action();
      setActiveMenu(null);
    }
  };

  const menus: Record<string, MenuItem[]> = {
    View: [
      {
        label: 'Spotlight Search…',
        icon: <IoSearchSharp size={16} />,
        action: () => onOpenSpotlight?.(),
      },
      {
        label: 'Mission Control',
        icon: <FaWindowRestore size={16} />,
        action: () => onOpenMissionControl?.(),
      },
      {
        label: 'Shortcuts Overlay',
        icon: <IoHelpCircle size={16} />,
        action: () => onToggleShortcuts?.(),
      },
      {
        label: 'Reset Tutorial',
        icon: <IoHelpCircle size={16} />,
        action: () => onShowTutorial?.(),
      },
    ],
    Window: [
      {
        label: 'Close All Windows',
        icon: <IoDocumentText size={16} />,
        action: () => onCloseAllWindows?.(),
      },
      {
        label: 'Shuffle Background',
        icon: <IoDocumentText size={16} />,
        action: () => onShuffleBackground?.(),
      },
    ],
    Help: [
      {
        label: 'Keyboard Shortcuts',
        icon: <IoHelpCircle size={16} />,
        action: () => onToggleShortcuts?.(),
      },
    ],
  };

  const renderMenu = (menuItems: MenuItem[]) => (
    <div className="absolute top-full left-0 mt-1 bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl py-1 min-w-[200px]" role="menu">
      {menuItems.map((item, index) => (
        <div key={index}>
          <button
            onClick={() => handleAction(item.action)}
            role="menuitem"
            className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700/50 flex items-center gap-2"
          >
            {item.icon}
            {item.label}
          </button>
          {item.submenu && (
            <div className="absolute left-full top-0 ml-1 bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl py-1 min-w-[200px]" role="menu">
              {item.submenu.map((subItem, subIndex) => (
                <button
                  key={subIndex}
                  onClick={() => handleAction(subItem.action)}
                  role="menuitem"
                  className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700/50 flex items-center gap-2"
                >
                  {subItem.icon}
                  {subItem.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className='sticky top-0 z-50 md:hidden bg-transparent text-white h-12 px-8 flex items-center justify-between text-base font-medium'>
        <span className='font-semibold'>
          {formatIPhoneTime(currentDateTime)}
        </span>
        <div className='flex items-center gap-1.5'>
          <IoCellular size={20} />
          <MdWifi size={20} />
          <IoBatteryHalfOutline size={24} />
        </div>
      </div>

      <div className='sticky top-0 z-50 hidden md:flex bg-black/20 backdrop-blur-md text-white h-6 px-4 items-center justify-between text-sm' role="menubar" aria-label="Application menu bar">
        <div className='flex items-center space-x-4' ref={menuRef}>
          <FaApple size={16} />
          {Object.entries(menus).map(([menu, items]) => (
            <div key={menu} className="relative">
              <button 
                className='cursor-pointer hover:text-gray-300 transition-colors'
                onClick={() => handleMenuClick(menu)}
                aria-haspopup="menu"
                aria-expanded={activeMenu === menu}
                aria-controls={`menu-${menu}`}
                role="menuitem"
              >
                {menu}
              </button>
              {activeMenu === menu && (
                <div id={`menu-${menu}`}>
                  {renderMenu(items)}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className='flex items-center space-x-4'>
          <VscVscode
            size={16}
            className='cursor-pointer hover:opacity-80 transition-opacity'
            onClick={handleVSCodeClick}
            title='Open in VSCode'
          />
          <MdWifi size={16} />
          <IoSearchSharp
            size={16}
            className='cursor-pointer hover:opacity-80 transition-opacity'
            onClick={() => onOpenSpotlight?.()}
            title='Search (Ctrl/Cmd+K)'
            role='button'
            aria-label='Open search'
          />
          <span className='cursor-default'>
            {formatMacDate(currentDateTime)}
          </span>
        </div>
      </div>
    </>
  );
}
