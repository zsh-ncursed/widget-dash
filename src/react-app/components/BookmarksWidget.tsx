import { useState, useEffect, useRef } from 'react';
import { Bookmark, Plus, Trash2, ExternalLink } from 'lucide-react';

interface BookmarkItem {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkItem[];
}

interface BookmarksWidgetProps {
  onDataChange?: () => void;
  widgetId: string;
}

export default function BookmarksWidget({ onDataChange, widgetId }: BookmarksWidgetProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [loadingTitle, setLoadingTitle] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [widgetName, setWidgetName] = useState('Bookmarks');
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBookmarks();
    // Загрузка названия виджета
    const browserAPI = (window as any).browser || (window as any).chrome;
    const nameKey = `widgetName_${widgetId}`;
    if (browserAPI && browserAPI.runtime) {
      browserAPI.runtime.sendMessage({ action: 'getStorage', keys: [nameKey] }, (response: any) => {
        if (response && response[nameKey]) setWidgetName(response[nameKey]);
      });
    } else {
      const saved = localStorage.getItem(nameKey);
      if (saved) setWidgetName(saved);
    }
  }, []);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [editingName]);

  const storageKey = `widgetBookmarks_${widgetId}`;
  const nameKey = `widgetName_${widgetId}`;

  const loadBookmarks = () => {
    const browserAPI = (window as any).browser || (window as any).chrome;
    
    if (browserAPI && browserAPI.runtime) {
      browserAPI.runtime.sendMessage({ action: 'getStorage', keys: [storageKey] }, (response: any) => {
        if (response && response[storageKey]) {
          setBookmarks(JSON.parse(response[storageKey]));
        } else {
          setBookmarks([]);
        }
      });
    } else {
      const savedBookmarks = localStorage.getItem(storageKey);
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
    }
  };

  // --- Новая функция для автозаполнения title ---
  const fetchTitle = async (url: string) => {
    setLoadingTitle(true);
    setTitleError('');
    try {
      const response = await fetch(url);
      const html = await response.text();
      const match = html.match(/<title>(.*?)<\/title>/i);
      if (match && match[1]) {
        setNewTitle(match[1]);
      } else {
        setNewTitle(url);
        setTitleError('Не удалось получить title. Используется url.');
      }
    } catch {
      setNewTitle(url);
      setTitleError('Не удалось получить title. Используется url.');
    }
    setLoadingTitle(false);
  };

  const handleUrlChange = (val: string) => {
    setNewUrl(val);
    setTitleError('');
    if (/^https?:\/\//.test(val)) {
      fetchTitle(val);
    } else {
      setNewTitle('');
    }
  };

  const addBookmark = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;

    const newBookmark = {
      id: `bookmark-${Date.now()}`,
      title: newTitle.trim(),
      url: newUrl.trim()
    };

    const browserAPI = (window as any).browser || (window as any).chrome;
    
    if (browserAPI && browserAPI.runtime) {
      const updated = [...bookmarks, newBookmark];
      browserAPI.runtime.sendMessage({ action: 'setStorage', data: { [storageKey]: JSON.stringify(updated) } }, () => {
        loadBookmarks();
        onDataChange?.();
      });
    } else {
      const updated = [...bookmarks, newBookmark];
      setBookmarks(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      onDataChange?.();
    }

    setNewTitle('');
    setNewUrl('');
    setShowAddForm(false);
    setTitleError('');
  };

  const removeBookmark = (id: string) => {
    const browserAPI = (window as any).browser || (window as any).chrome;
    
    if (browserAPI && browserAPI.runtime) {
      const updated = bookmarks.filter(b => b.id !== id);
      browserAPI.runtime.sendMessage({ action: 'setStorage', data: { [storageKey]: JSON.stringify(updated) } }, () => {
        loadBookmarks();
        onDataChange?.();
      });
    } else {
      const updated = bookmarks.filter(b => b.id !== id);
      setBookmarks(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      onDataChange?.();
    }
  };

  const saveWidgetName = (val: string) => {
    setWidgetName(val);
    setEditingName(false);
    const browserAPI = (window as any).browser || (window as any).chrome;
    if (browserAPI && browserAPI.runtime) {
      browserAPI.runtime.sendMessage({ action: 'setStorage', data: { [nameKey]: val } }, () => {});
    } else {
      localStorage.setItem(nameKey, val);
    }
  };

  const getFaviconUrl = (url: string) => {
    try {
      const u = new URL(url);
      return `${u.protocol}//${u.hostname}/favicon.ico`;
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <div className="font-bold mb-2 flex items-center gap-2 select-none">
        <Bookmark className="inline w-5 h-5" />
        {editingName ? (
          <input
            ref={nameInputRef}
            className="text-base font-bold bg-white dark:bg-gray-800 border-b border-blue-400 outline-none px-1"
            value={editNameValue}
            onChange={e => setEditNameValue(e.target.value)}
            onBlur={() => saveWidgetName(editNameValue.trim() || 'Bookmarks')}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                saveWidgetName(editNameValue.trim() || 'Bookmarks');
              }
            }}
          />
        ) : (
          <span
            onDoubleClick={() => {
              setEditNameValue(widgetName);
              setEditingName(true);
            }}
            title="Двойной клик для редактирования названия"
            className="cursor-pointer"
          >
            {widgetName}
          </span>
        )}
      </div>
      <ul className="mb-3">
        {bookmarks.map(b => (
          <li key={b.id} className="flex items-center gap-2 mb-1">
            <img src={getFaviconUrl(b.url || '')} alt="" className="w-4 h-4" />
            <a href={b.url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate hover:underline">
              {b.title}
            </a>
            <a href={b.url} target="_blank" rel="noopener noreferrer" title="Open" className="text-blue-500"><ExternalLink className="w-4 h-4" /></a>
            <button onClick={() => removeBookmark(b.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
          </li>
        ))}
      </ul>
      {showAddForm ? (
        <div className="mb-2 flex flex-col gap-2">
          <input
            className="p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            type="url"
            placeholder="URL"
            value={newUrl}
            onChange={e => handleUrlChange(e.target.value)}
            autoFocus
          />
          <input
            className="p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            type="text"
            placeholder="Title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            disabled={loadingTitle}
          />
          {titleError && <div className="text-xs text-red-500">{titleError}</div>}
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded bg-green-500 text-white hover:bg-green-600" onClick={addBookmark} disabled={loadingTitle}>Add</button>
            <button className="px-3 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="px-3 py-2 rounded bg-blue-500 text-white hover:bg-blue-600" onClick={() => setShowAddForm(true)}>
          <Plus className="inline w-4 h-4 mr-1" /> Add Bookmark
        </button>
      )}
    </div>
  );
}
