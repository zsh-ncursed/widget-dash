import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface Tab {
  id: string;
  name: string;
  active: boolean;
}

interface TabsBarProps {
  tabs: Tab[];
  setTabs: (tabs: Tab[]) => void;
}

export default function TabsBar({ tabs, setTabs }: TabsBarProps) {
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const addTab = () => {
    const newTab = {
      id: `tab-${Date.now()}`,
      name: `Page ${tabs.length + 1}`,
      active: false
    };
    setTabs([...tabs, newTab]);
  };

  const removeTab = (tabId: string) => {
    if (tabs.length <= 1) return;
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    if (tabs.find(tab => tab.id === tabId)?.active && newTabs.length > 0) {
      newTabs[0].active = true;
    }
    setTabs(newTabs);
  };

  const setActiveTab = (tabId: string) => {
    setTabs(tabs.map(tab => ({ ...tab, active: tab.id === tabId })));
  };

  const startEditing = (tab: Tab) => {
    setEditingTab(tab.id);
    setEditName(tab.name);
  };

  const saveEdit = () => {
    if (editingTab && editName.trim()) {
      setTabs(tabs.map(tab => 
        tab.id === editingTab ? { ...tab, name: editName.trim() } : tab
      ));
    }
    setEditingTab(null);
    setEditName('');
  };

  const cancelEdit = () => {
    setEditingTab(null);
    setEditName('');
  };

  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
            tab.active 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {editingTab === tab.id ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              className="bg-transparent border-none outline-none text-sm min-w-16"
              autoFocus
            />
          ) : (
            <span
              onClick={() => setActiveTab(tab.id)}
              onDoubleClick={() => startEditing(tab)}
              className="cursor-pointer text-sm"
            >
              {tab.name}
            </span>
          )}
          
          {tabs.length > 1 && (
            <button
              onClick={() => removeTab(tab.id)}
              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-500 hover:text-red-700"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
      
      <button
        onClick={addTab}
        className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
        title="Add new tab"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
