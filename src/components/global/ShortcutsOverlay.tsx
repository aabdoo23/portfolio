interface ShortcutsOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function ShortcutsOverlay({ open, onClose }: ShortcutsOverlayProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-auto mt-20 w-[92%] max-w-2xl rounded-xl border border-white/10 bg-gray-900/95 shadow-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Keyboard Shortcuts</h3>
          <button className="text-gray-400 hover:text-gray-200" onClick={onClose}>✕</button>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-300">
          <li><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/10 mr-2">Cmd/Ctrl</kbd><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/10 mr-2">K</kbd>Open Spotlight</li>
          <li><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/10 mr-2">Esc</kbd>Close modal/menu</li>
          <li><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/10 mr-2">↑</kbd><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/10 mr-2">↓</kbd>Navigate list</li>
          <li><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/10 mr-2">Enter</kbd>Select</li>
          <li><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/10 mr-2">B</kbd>Shuffle wallpaper</li>
          <li><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/10 mr-2">X</kbd>Close all windows</li>
          <li><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/10 mr-2">Ctrl/Cmd</kbd><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/10 mr-2">↑</kbd>or <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/10 mr-2">F3</kbd>Mission Control</li>
          <li><kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/10 mr-2">?</kbd>Show this overlay</li>
        </ul>
      </div>
    </div>
  );
}
