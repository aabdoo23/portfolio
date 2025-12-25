import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import type { FuseResult } from 'fuse.js';
import { FaRegFileAlt } from 'react-icons/fa';
import { IoBookOutline, IoSearch } from 'react-icons/io5';
import { BsCollection } from 'react-icons/bs';

type SpotlightItem = {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  keywords?: string[];
  icon?: React.ReactNode;
  action: () => void;
};

export interface SpotlightProps {
  isOpen: boolean;
  onClose: () => void;
  actions: {
    openNotes: () => void;
    openNotesSection: () => void;
    openPhotoAlbum: () => void;
    closeAllWindows: () => void;
    shuffleBackground: () => void;
  };
}

export default function Spotlight({ isOpen, onClose, actions }: SpotlightProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const items = useMemo<SpotlightItem[]>(() => {
    const quickActions: SpotlightItem[] = [
      {
        id: 'action:notes',
        title: 'Open Notes',
        subtitle: 'View your notes',
        category: 'Actions',
        icon: <IoBookOutline className="text-gray-300" />,
        action: actions.openNotes,
      },
      {
        id: 'action:photoAlbum',
        title: 'Open Photos',
        subtitle: 'View iCloud shared album',
        category: 'Actions',
        icon: <BsCollection className="text-gray-300" />,
        action: actions.openPhotoAlbum,
      },
      {
        id: 'action:close-all',
        title: 'Close all windows',
        subtitle: 'Hide all open windows',
        category: 'Actions',
        icon: <FaRegFileAlt className="text-gray-300" />,
        action: actions.closeAllWindows,
      },
      {
        id: 'action:shuffle-bg',
        title: 'Shuffle background',
        subtitle: 'Switch wallpaper',
        category: 'Actions',
        icon: <FaRegFileAlt className="text-gray-300" />,
        action: actions.shuffleBackground,
      },
    ];

    return quickActions;
  }, [actions]);

  const fuse = useMemo(() => {
    return new Fuse(items, {
      keys: [
        { name: 'title', weight: 0.6 },
        { name: 'subtitle', weight: 0.2 },
        { name: 'category', weight: 0.1 },
        { name: 'keywords', weight: 0.1 },
      ],
      threshold: 0.38,
      ignoreLocation: true,
      includeScore: true,
    });
  }, [items]);

  const results = useMemo<SpotlightItem[]>(() => {
    const pinnedIds = ['action:notes'];
    if (!query.trim()) {
      const base = items.slice(0, 8);
      // Ensure pinned are first when empty query
      const pinned = items.filter(i => pinnedIds.includes(i.id));
      const rest = base.filter(i => !pinnedIds.includes(i.id));
      return [...pinned, ...rest].slice(0, 8);
    }
    const searched = fuse
      .search(query)
      .slice(0, 20)
      .map((r: FuseResult<SpotlightItem>) => r.item);
    const pinned = items.filter(i => pinnedIds.includes(i.id));
    // Deduplicate by id while placing pinned first
    const seen = new Set<string>();
    const combined = [...pinned, ...searched].filter(i => {
      if (seen.has(i.id)) return false;
      seen.add(i.id);
      return true;
    });
    return combined.slice(0, 20);
  }, [query, items, fuse]);

  // Group results by category with fixed order
  const grouped = useMemo(() => {
    const order = ['Actions'];
    const map = new Map<string, SpotlightItem[]>();
    for (const item of results) {
      const arr = map.get(item.category) ?? [];
      arr.push(item);
      map.set(item.category, arr);
    }
    return order
      .filter((cat) => map.has(cat))
      .map((cat) => ({ category: cat, items: map.get(cat)!, count: map.get(cat)!.length }));
  }, [results]);

  // Show more per group state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (cat: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const close = useCallback(() => {
    onClose();
    setQuery('');
    setActiveIndex(0);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          close();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const item = results[activeIndex];
          if (item) {
            item.action();
            close();
          }
        } else if ((e.key === 'B' || e.key === 'b') && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          actions.shuffleBackground();
          close();
        } else if ((e.key === 'X' || e.key === 'x') && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          actions.closeAllWindows();
          close();
        }
      };
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [isOpen, results, activeIndex, close]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Spotlight search">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={close}
      />
      <div className="relative mx-auto mt-20 w-[92%] max-w-2xl rounded-xl border border-white/10 bg-gray-900/95 shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <IoSearch className="text-gray-400" size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search actions…"
            className="flex-1 bg-transparent outline-none text-sm md:text-base text-white placeholder-gray-400"
            aria-label="Search input"
          />
          <span className="hidden md:inline text-[10px] text-gray-400 border border-white/10 rounded px-1.5 py-0.5">Esc</span>
        </div>
        <ul role="listbox" className="max-h-[60vh] overflow-y-auto py-1">
          {results.length === 0 && (
            <li className="px-4 py-3 text-gray-400 text-sm">No results</li>
          )}
          {grouped.map(group => (
            <React.Fragment key={`group-${group.category}`}>
              <li className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm px-4 py-2 text-[10px] uppercase tracking-wide text-gray-400 border-b border-white/5 flex items-center justify-between">
                <span>{group.category}</span>
                <span className="opacity-70">{group.count}</span>
              </li>
              {(expandedGroups.has(group.category) ? group.items : group.items.slice(0, 5)).map((item: SpotlightItem) => {
                const idx = results.findIndex((r) => r.id === item.id);
                return (
                  <li key={item.id}>
                    <button
                      role="option"
                      aria-selected={activeIndex === idx}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => {
                        item.action();
                        close();
                      }}
                      className={`${activeIndex === idx ? 'bg-white/10' : ''} w-full px-4 py-2.5 flex items-start gap-3 text-left`}
                    >
                      <div className="mt-0.5">{item.icon}</div>
                      <div className="flex-1">
                        <div className="text-sm text-white">{item.title}</div>
                        <div className="text-xs text-gray-400">{item.subtitle ?? item.category}</div>
                      </div>
                      <span className="text-[10px] text-gray-500 border border-white/10 rounded px-1 py-0.5">{item.category}</span>
                    </button>
                  </li>
                );
              })}
              {group.items.length > 5 && (
                <li className="px-4 py-2">
                  <button
                    className="text-xs text-blue-400 hover:text-blue-300"
                    onClick={() => toggleGroup(group.category)}
                  >
                    {expandedGroups.has(group.category) ? 'Show less' : `Show ${group.items.length - 5} more`}
                  </button>
                </li>
              )}
            </React.Fragment>
          ))}
        </ul>
      </div>
    </div>
  );
}
