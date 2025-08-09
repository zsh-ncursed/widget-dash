import { useState, useEffect } from 'react';
import WidgetTitle from './WidgetTitle';

interface NotesWidgetProps {
  onDataChange?: () => void;
  widgetId: string;
}

export default function NotesWidget({ onDataChange, widgetId }: NotesWidgetProps) {
  const [notes, setNotes] = useState<string>('');
  const storageKey = `widgetNotes_${widgetId}`;

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    const browserAPI = (window as any).browser || (window as any).chrome;
    if (browserAPI && browserAPI.runtime) {
      browserAPI.runtime.sendMessage({ action: 'getStorage', keys: [storageKey] }, (response: any) => {
        if (response && response[storageKey]) {
          setNotes(response[storageKey]);
        } else {
          setNotes('');
        }
      });
    } else {
      const saved = localStorage.getItem(storageKey);
      if (saved) setNotes(saved);
    }
  };

  const saveNotes = (value: string) => {
    setNotes(value);
    const browserAPI = (window as any).browser || (window as any).chrome;
    if (browserAPI && browserAPI.runtime) {
      browserAPI.runtime.sendMessage({ action: 'setStorage', data: { [storageKey]: value } }, () => {
        onDataChange?.();
      });
    } else {
      localStorage.setItem(storageKey, value);
      onDataChange?.();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <WidgetTitle widgetId={widgetId} defaultTitle="Notes" />
      <textarea
        className="w-full h-32 p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        value={notes}
        onChange={e => saveNotes(e.target.value)}
      />
    </div>
  );
}
