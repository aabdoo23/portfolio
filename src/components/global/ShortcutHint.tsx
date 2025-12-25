import React from 'react';
import { IoSearch, IoDocumentTextOutline } from 'react-icons/io5';
import { FaRegKeyboard } from 'react-icons/fa';

export default function ShortcutHint() {

  const shortcuts = [
    { key: '(CTRL/⌘)+K', label: 'Search', icon: <IoSearch size={14} /> },
    { key: '? or (CTRL/⌘)+H', label: 'Help', icon: <FaRegKeyboard size={14} /> },
    { key: '(CTRL/⌘)+M or (CTRL/⌘)+Up', label: 'Mission Control', icon: <IoDocumentTextOutline size={14} /> },

  ];
  
  return (
    <div className="fixed top-8 left-4 z-[1] animate-fade-in hidden md:block">
      <div className="bg-gray-900/90 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 shadow-xl">
        <div className="flex items-center gap-3 text-sm text-gray-300">
          {shortcuts.map((shortcut, idx) => (
            <React.Fragment key={shortcut.key}>
              {idx > 0 && <span className="text-gray-600">•</span>}
              <div className="flex items-center gap-1.5">
                {shortcut.icon}
                <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-[10px] font-mono">
                  {shortcut.key}
                </kbd>
                <span className="hidden sm:inline">{shortcut.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
