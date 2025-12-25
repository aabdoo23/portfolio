import { useState, useEffect } from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
  updated_at: string;
  created_at: string;
}

interface ConfigItem {
  value: string;
  updated_at: string;
}

interface Background {
  id: string;
  url: string;
  display_url?: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

type Tab = 'notes' | 'config' | 'backgrounds';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('notes');

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [notesError, setNotesError] = useState('');

  // Config state
  const [config, setConfig] = useState<Record<string, ConfigItem>>({});
  const [configLoading, setConfigLoading] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Record<string, string>>({});
  const [configError, setConfigError] = useState('');

  // Backgrounds state
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [backgroundsLoading, setBackgroundsLoading] = useState(false);
  const [backgroundsError, setBackgroundsError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backgroundName, setBackgroundName] = useState('');

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth');
      const data = await response.json();
      setIsAuthenticated(data.authenticated === true);
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setUsername('');
        setPassword('');
        // Load data after login
        if (activeTab === 'notes') {
          loadNotes();
        } else if (activeTab === 'config') {
          loadConfig();
        } else if (activeTab === 'backgrounds') {
          loadBackgrounds();
        }
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (error) {
      setLoginError('Login failed. Please try again.');
    }
  };

  const handleLogout = () => {
    // Clear cookie by setting it to expire
    document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setIsAuthenticated(false);
    setNotes([]);
    setConfig({});
    setBackgrounds([]);
  };

  // Notes management
  const loadNotes = async () => {
    setNotesLoading(true);
    setNotesError('');
    try {
      const response = await fetch('/api/admin/notes');
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      } else {
        setNotesError('Failed to load notes');
      }
    } catch (error) {
      setNotesError('Failed to load notes');
    } finally {
      setNotesLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      setNotesError('Title and content are required');
      return;
    }

    try {
      const response = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      });

      if (response.ok) {
        setNewNote({ title: '', content: '' });
        loadNotes();
      } else {
        const data = await response.json();
        setNotesError(data.error || 'Failed to create note');
      }
    } catch (error) {
      setNotesError('Failed to create note');
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;

    try {
      const response = await fetch('/api/admin/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingNote),
      });

      if (response.ok) {
        setEditingNote(null);
        loadNotes();
      } else {
        const data = await response.json();
        setNotesError(data.error || 'Failed to update note');
      }
    } catch (error) {
      setNotesError('Failed to update note');
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/admin/notes?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadNotes();
      } else {
        const data = await response.json();
        setNotesError(data.error || 'Failed to delete note');
      }
    } catch (error) {
      setNotesError('Failed to delete note');
    }
  };

  // Config management
  const loadConfig = async () => {
    setConfigLoading(true);
    setConfigError('');
    try {
      const response = await fetch('/api/admin/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        // Initialize editing state with current values, and ensure SEO fields exist
        const editingState: Record<string, string> = {};
        Object.keys(data).forEach((key) => {
          editingState[key] = data[key].value;
        });
        // Ensure SEO fields exist in editing state (for creating new entries)
        if (!editingState['seo_title']) editingState['seo_title'] = '';
        if (!editingState['seo_description']) editingState['seo_description'] = '';
        if (!editingState['seo_keywords']) editingState['seo_keywords'] = JSON.stringify([]);
        setEditingConfig(editingState);
      } else {
        setConfigError('Failed to load config');
      }
    } catch (error) {
      setConfigError('Failed to load config');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleUpdateConfig = async (key: string) => {
    const value = editingConfig[key];
    if (value === undefined) return;

    try {
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });

      if (response.ok) {
        loadConfig();
      } else {
        const data = await response.json();
        setConfigError(data.error || `Failed to update ${key}`);
      }
    } catch (error) {
      setConfigError(`Failed to update ${key}`);
    }
  };

  // Backgrounds management
  const loadBackgrounds = async () => {
    setBackgroundsLoading(true);
    setBackgroundsError('');
    try {
      const response = await fetch('/api/admin/backgrounds');
      if (response.ok) {
        const data = await response.json();
        setBackgrounds(data);
      } else {
        setBackgroundsError('Failed to load backgrounds');
      }
    } catch (error) {
      setBackgroundsError('Failed to load backgrounds');
    } finally {
      setBackgroundsLoading(false);
    }
  };

  const handleUploadBackground = async () => {
    if (!selectedFile) {
      setBackgroundsError('Please select an image file');
      return;
    }

    setUploading(true);
    setBackgroundsError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      if (backgroundName.trim()) {
        formData.append('name', backgroundName.trim());
      }

      const response = await fetch('/api/admin/backgrounds', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSelectedFile(null);
        setBackgroundName('');
        loadBackgrounds();
      } else {
        const data = await response.json();
        setBackgroundsError(data.error || 'Failed to upload background');
      }
    } catch (error) {
      setBackgroundsError('Failed to upload background');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteBackground = async (id: string) => {
    if (!confirm('Are you sure you want to delete this background?')) return;

    try {
      const response = await fetch(`/api/admin/backgrounds?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadBackgrounds();
      } else {
        const data = await response.json();
        setBackgroundsError(data.error || 'Failed to delete background');
      }
    } catch (error) {
      setBackgroundsError('Failed to delete background');
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'notes') {
        loadNotes();
      } else if (activeTab === 'config') {
        loadConfig();
      } else if (activeTab === 'backgrounds') {
        loadBackgrounds();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAuthenticated]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-6">Admin Login</h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {loginError && (
              <div className="mb-4 text-red-400 text-sm">{loginError}</div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'notes'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'config'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('backgrounds')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'backgrounds'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Backgrounds
          </button>
        </div>

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">Manage Notes</h2>
              
              {/* Create New Note */}
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold mb-4">Create New Note</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Title"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    placeholder="Content"
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleCreateNote}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    Create Note
                  </button>
                </div>
              </div>

              {notesError && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                  {notesError}
                </div>
              )}

              {/* Notes List */}
              {notesLoading ? (
                <div className="text-center py-8">Loading notes...</div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="bg-gray-800 rounded-lg p-4">
                      {editingNote?.id === note.id ? (
                        <div className="space-y-4">
                          <input
                            type="text"
                            value={editingNote.title}
                            onChange={(e) =>
                              setEditingNote({ ...editingNote, title: e.target.value })
                            }
                            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <textarea
                            value={editingNote.content}
                            onChange={(e) =>
                              setEditingNote({ ...editingNote, content: e.target.value })
                            }
                            rows={8}
                            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateNote}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingNote(null)}
                              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-semibold">{note.title}</h3>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingNote(note)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-300 whitespace-pre-wrap mb-2">{note.content}</p>
                          <p className="text-sm text-gray-500">
                            Updated: {new Date(note.updated_at).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  {notes.length === 0 && !notesLoading && (
                    <div className="text-center py-8 text-gray-400">No notes yet</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Manage Configuration</h2>

            {configError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                {configError}
              </div>
            )}

            {configLoading ? (
              <div className="text-center py-8">Loading config...</div>
            ) : (
              <div className="space-y-6">
                {/* SEO Section */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">SEO Configuration</h3>
                  <div className="space-y-4">
                    {['seo_title', 'seo_description', 'seo_keywords'].map((key) => {
                      const isKeywords = key === 'seo_keywords';
                      const existingValue = config[key];
                      
                      // For keywords, convert JSON array to comma-separated for display
                      const getDisplayValue = () => {
                        const val = editingConfig[key] !== undefined 
                          ? editingConfig[key] 
                          : (existingValue?.value || '');
                        if (isKeywords && val) {
                          try {
                            const parsed = JSON.parse(val);
                            if (Array.isArray(parsed)) {
                              return parsed.join(', ');
                            }
                          } catch {
                            return val;
                          }
                        }
                        return val;
                      };
                      
                      const handleValueChange = (newValue: string) => {
                        if (isKeywords) {
                          const keywordsArray = newValue
                            .split(',')
                            .map(k => k.trim())
                            .filter(k => k.length > 0);
                          setEditingConfig({ ...editingConfig, [key]: JSON.stringify(keywordsArray) });
                        } else {
                          setEditingConfig({ ...editingConfig, [key]: newValue });
                        }
                      };

                      const labelText = key === 'seo_title' 
                        ? 'SEO Title'
                        : key === 'seo_description'
                        ? 'SEO Description'
                        : 'SEO Keywords (comma-separated)';

                      return (
                        <div key={key} className="bg-gray-800 rounded-lg p-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {labelText}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={getDisplayValue()}
                              onChange={(e) => handleValueChange(e.target.value)}
                              placeholder={isKeywords ? "keyword1, keyword2, keyword3" : undefined}
                              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handleUpdateConfig(key)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                              Save
                            </button>
                          </div>
                          {isKeywords && (
                            <p className="text-xs text-gray-500 mt-1">
                              Keywords will be stored as a JSON array
                            </p>
                          )}
                          {existingValue && (
                            <p className="text-xs text-gray-500 mt-2">
                              Last updated: {new Date(existingValue.updated_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Other Config Section */}
                {Object.keys(config).filter(key => !key.startsWith('seo_')).length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Other Configuration</h3>
                    <div className="space-y-4">
                      {Object.keys(config).filter(key => !key.startsWith('seo_')).map((key) => {
                        const labelText = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

                        return (
                          <div key={key} className="bg-gray-800 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              {labelText}
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editingConfig[key] || ''}
                                onChange={(e) =>
                                  setEditingConfig({ ...editingConfig, [key]: e.target.value })
                                }
                                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                onClick={() => handleUpdateConfig(key)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                              >
                                Save
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Last updated: {new Date(config[key].updated_at).toLocaleString()}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Backgrounds Tab */}
        {activeTab === 'backgrounds' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Manage Backgrounds</h2>

            {/* Upload New Background */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4">Upload New Background</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Image File
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Background name"
                    value={backgroundName}
                    onChange={(e) => setBackgroundName(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleUploadBackground}
                  disabled={!selectedFile || uploading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {uploading ? 'Uploading...' : 'Upload Background'}
                </button>
              </div>
            </div>

            {backgroundsError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                {backgroundsError}
              </div>
            )}

            {/* Backgrounds Grid */}
            {backgroundsLoading ? (
              <div className="text-center py-8">Loading backgrounds...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {backgrounds.map((bg) => (
                  <div key={bg.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="aspect-video mb-3 rounded overflow-hidden bg-gray-700">
                      <img
                        src={bg.display_url || bg.url}
                        alt={bg.name || 'Background'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-300">
                        {bg.name || 'Unnamed Background'}
                      </p>
                      <p className="text-xs text-gray-500 truncate" title={bg.url}>
                        {bg.url}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteBackground(bg.id)}
                      className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {backgrounds.length === 0 && !backgroundsLoading && (
                  <div className="col-span-full text-center py-8 text-gray-400">
                    No backgrounds yet. Upload one to get started!
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

