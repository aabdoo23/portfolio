import { useState, useEffect } from 'react';
import DraggableWindow from './DraggableWindow';

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

interface NotesAppProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotesApp = ({ isOpen, onClose }: NotesAppProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch notes from API
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch('/api/content/notes');
        if (response.ok) {
          const data = await response.json();
          setNotes(data || []);
        } else {
          console.error('Failed to fetch notes:', response.status, response.statusText);
          setNotes([]);
        }
      } catch (error) {
        console.error('Failed to fetch notes:', error);
        setNotes([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchNotes();
    }
  }, [isOpen]);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Select first note by default on desktop
  useEffect(() => {
    if (isOpen && !selectedNoteId && notes.length > 0 && !isMobile && !isLoading) {
      setSelectedNoteId(notes[0].id);
    }
  }, [isOpen, isMobile, notes, isLoading, selectedNoteId]);

  if (!isOpen) return null;

  const selectedNote = selectedNoteId ? notes.find(n => n.id === selectedNoteId) : null;

  // Filter notes based on search query
  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    }
  };

  // Get preview text (first line or first 50 chars)
  const getPreview = (content: string) => {
    const firstLine = content.split('\n')[0];
    if (firstLine.length <= 50) return firstLine;
    return firstLine.substring(0, 50) + '...';
  };

  const renderNoteList = () => (
    <div className="flex flex-col h-full bg-gray-800/30 border-r border-gray-700/50">
      {/* Search bar */}
      <div className="p-3 border-b border-gray-700/50">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
        />
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            {searchQuery ? 'No notes found' : 'No notes yet'}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => setSelectedNoteId(note.id)}
              className={`w-full text-left p-3 border-b border-gray-700/30 hover:bg-gray-700/30 transition-colors ${
                selectedNoteId === note.id ? 'bg-gray-700/50' : ''
              }`}
            >
              <div className="font-semibold text-gray-200 mb-1 truncate">{note.title}</div>
              <div className="text-sm text-gray-400 mb-1 line-clamp-2">{getPreview(note.content)}</div>
              <div className="text-xs text-gray-500">{formatDate(note.updatedAt)}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  const renderNoteContent = () => {
    if (!selectedNote) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-lg">Select a note to view</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Note header */}
        <div className="p-4 border-b border-gray-700/50">
          <h2 className="text-2xl font-semibold text-gray-200 mb-2">{selectedNote.title}</h2>
          <div className="text-xs text-gray-400">
            Updated {formatDate(selectedNote.updatedAt)}
          </div>
        </div>

        {/* Note content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
            {selectedNote.content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DraggableWindow
      title="Notes"
      onClose={onClose}
      initialPosition={{
        x: Math.floor(window.innerWidth * 0.1),
        y: Math.floor(window.innerHeight * 0.1),
      }}
      className="w-[95vw] md:w-[90vw] max-w-6xl h-[85vh] max-h-[800px] flex flex-col"
      initialSize={{ width: 900, height: 700 }}
    >
      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar - hidden on mobile when note is selected */}
        {(!isMobile || !selectedNoteId) && (
          <div className={`${isMobile ? 'w-full' : 'w-80'} flex-shrink-0`}>
            {renderNoteList()}
          </div>
        )}

        {/* Main content - hidden on mobile when no note selected */}
        {(!isMobile || selectedNoteId) && (
          <div className={`${isMobile ? 'w-full' : 'flex-1'} flex flex-col`}>
            {isMobile && selectedNoteId && (
              <button
                onClick={() => setSelectedNoteId(null)}
                className="p-2 text-gray-400 hover:text-gray-200"
                aria-label="Back to notes list"
              >
                ← Back
              </button>
            )}
            {renderNoteContent()}
          </div>
        )}
      </div>
    </DraggableWindow>
  );
};

export default NotesApp;
