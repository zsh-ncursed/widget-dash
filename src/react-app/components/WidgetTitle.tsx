import { useState, useEffect, useRef } from 'react';

interface WidgetTitleProps {
  widgetId: string;
  defaultTitle: string;
}

export default function WidgetTitle({ widgetId, defaultTitle }: WidgetTitleProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(defaultTitle);
  const inputRef = useRef<HTMLInputElement>(null);
  const nameKey = `widgetName_${widgetId}`;

  useEffect(() => {
    const browserAPI = (window as any).browser || (window as any).chrome;
    if (browserAPI && browserAPI.runtime) {
      browserAPI.runtime.sendMessage({ action: 'getStorage', keys: [nameKey] }, (response: any) => {
        if (response && response[nameKey]) setTitle(response[nameKey]);
      });
    } else {
      const saved = localStorage.getItem(nameKey);
      if (saved) setTitle(saved);
    }
  }, [widgetId]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const save = (val: string) => {
    setTitle(val);
    setEditing(false);
    const browserAPI = (window as any).browser || (window as any).chrome;
    if (browserAPI && browserAPI.runtime) {
      browserAPI.runtime.sendMessage({ action: 'setStorage', data: { [nameKey]: val } }, () => {});
    } else {
      localStorage.setItem(nameKey, val);
    }
  };

  return (
    <div className="font-bold mb-2 flex items-center gap-2 select-none">
      {editing ? (
        <input
          ref={inputRef}
          className="text-base font-bold bg-white dark:bg-gray-800 border-b border-blue-400 outline-none px-1"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={() => save(editValue.trim() || defaultTitle)}
          onKeyDown={e => {
            if (e.key === 'Enter') save(editValue.trim() || defaultTitle);
          }}
        />
      ) : (
        <span
          onDoubleClick={() => {
            setEditValue(title);
            setEditing(true);
          }}
          title="Двойной клик для редактирования названия"
          className="cursor-pointer"
        >
          {title}
        </span>
      )}
    </div>
  );
}