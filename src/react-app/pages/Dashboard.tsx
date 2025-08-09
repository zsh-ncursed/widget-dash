import { useState, useEffect, useCallback } from 'react';
import { Settings, Moon, Sun } from 'lucide-react';
import BookmarksWidget from '@/react-app/components/BookmarksWidget';
import NotesWidget from '@/react-app/components/NotesWidget';
import CalendarWidget from '@/react-app/components/CalendarWidget';
import TodoWidget from '@/react-app/components/TodoWidget';
import ClockWidget from '@/react-app/components/ClockWidget';
import CalculatorWidget from '@/react-app/components/CalculatorWidget';
import TabsBar from '@/react-app/components/TabsBar';
import WidgetZone from '@/react-app/components/WidgetZone';
 

export default function Dashboard() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [tabs, setTabs] = useState([{ id: 'default', name: 'Home', active: true }]);
  const [tabWidgets, setTabWidgets] = useState<Record<string, {
    zone1: string[];
    zone2: string[];
    zone3: string[];
  }>>({
    'default': {
      zone1: ['bookmarks', 'notes'],
      zone2: ['calendar', 'todo'],
      zone3: ['clock', 'calculator']
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  

  // Function to apply theme - defined before useEffects
  const applyTheme = (themeValue: 'light' | 'dark') => {
    const html = document.documentElement;
    const body = document.body;
    
    console.log('Applying theme:', themeValue);
    
    if (themeValue === 'dark') {
      html.classList.add('dark');
      body.classList.add('dark');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      body.classList.remove('dark');
      html.style.colorScheme = 'light';
    }
    
    console.log('Theme applied - HTML classes:', html.classList.toString());
  };

  // Storage utility functions
  const storageUtils = {
    async get(keys: string[] | null = null) {
      const browserAPI = (window as any).browser || (window as any).chrome;
      if (browserAPI && browserAPI.runtime) {
        return new Promise((resolve) => {
          browserAPI.runtime.sendMessage({ action: 'getStorage', keys }, resolve);
        });
      } else {
        // Fallback to localStorage
        if (keys === null) {
          return {
            theme: localStorage.getItem('theme') || 'light',
            tabWidgets: JSON.parse(localStorage.getItem('tabWidgets') || '{}'),
            tabs: JSON.parse(localStorage.getItem('tabs') || '[{"id":"default","name":"Home","active":true}]')
          };
        } else {
          const result: any = {};
          keys.forEach(key => {
            result[key] = localStorage.getItem(key);
          });
          return result;
        }
      }
    },

    async set(data: any) {
      const browserAPI = (window as any).browser || (window as any).chrome;
      if (browserAPI && browserAPI.runtime) {
        return new Promise((resolve) => {
          browserAPI.runtime.sendMessage({ action: 'setStorage', data }, resolve);
        });
      } else {
        // Fallback to localStorage
        Object.keys(data).forEach(key => {
          localStorage.setItem(key, typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]));
        });
        return { success: true };
      }
    }
  };

  

  

  const saveSettings = useCallback(() => {
    const data = { theme, tabWidgets, tabs };
    storageUtils.set(data);
  }, [theme, tabWidgets, tabs]);

  const toggleTheme = () => {
    console.log('Toggle theme clicked, current theme:', theme);
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('Setting new theme:', newTheme);
    setTheme(newTheme);
  };

  // Load initial settings and WebDAV config
  useEffect(() => {
    storageUtils.get(['theme', 'tabWidgets', 'tabs']).then((result: any) => {
      if (result.theme) {
        setTheme(result.theme);
      } else {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = systemPrefersDark ? 'dark' : 'light';
        setTheme(initialTheme);
      }
      if (result.tabWidgets) setTabWidgets(result.tabWidgets);
      if (result.tabs) setTabs(result.tabs);
    }).catch((error) => {
      console.error('Error loading settings:', error);
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(systemPrefersDark ? 'dark' : 'light');
    });
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    console.log('Theme state changed to:', theme);
    applyTheme(theme);
    saveSettings();
  }, [theme]);

  // Save other settings when they change
  useEffect(() => {
    saveSettings();
  }, [tabWidgets, tabs]);

  const renderWidget = (type: string, zone: string, index: number) => {
    const activeTab = tabs.find(tab => tab.active) || tabs[0];
    const widgetId = `${activeTab.id}_${zone}_${index}_${type}`;
    switch (type) {
      case 'bookmarks':
        return <BookmarksWidget key={widgetId} widgetId={widgetId} onDataChange={syncToWebDAV} />;
      case 'notes':
        return <NotesWidget key={widgetId} widgetId={widgetId} onDataChange={syncToWebDAV} />;
      case 'calendar':
        return <CalendarWidget key={widgetId} widgetId={widgetId} onDataChange={syncToWebDAV} />;
      case 'todo':
        return <TodoWidget key={widgetId} widgetId={widgetId} onDataChange={syncToWebDAV} />;
      case 'clock':
        return <ClockWidget key={widgetId} widgetId={widgetId} />;
      case 'calculator':
        return <CalculatorWidget key={widgetId} widgetId={widgetId} />;
      default:
        return null;
    }
  };

  // Обертка для setTabs, чтобы при добавлении новой вкладки зоны были пустыми
  const handleSetTabs = (newTabs: typeof tabs) => {
    // если вкладок стало больше, значит добавили новую
    if (newTabs.length > tabs.length) {
      const newTab = newTabs[newTabs.length - 1];
      setTabWidgets(prev => ({
        ...prev,
        [newTab.id]: {
          zone1: [],
          zone2: [],
          zone3: []
        }
      }));
    }
    setTabs(newTabs);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-3 lg:p-5">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold">Widget Dashboard</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <TabsBar 
          tabs={tabs} 
          setTabs={handleSetTabs}
        />

        {/* Settings Panel */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-80 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-semibold mb-4">Settings</h3>
              <div className="space-y-3">
                <button 
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    // Export functionality
                    const data = { theme, tabWidgets, tabs };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'widget-dashboard-backup.json';
                    a.click();
                    URL.revokeObjectURL(url);
                    setShowSettings(false);
                  }}
                >
                  <div className="font-medium">Export</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Export your dashboard settings</div>
                </button>
                
                <button 
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    // Import functionality
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          try {
                            const data = JSON.parse(e.target?.result as string);
                            if (data.theme) setTheme(data.theme);
                            if (data.tabWidgets) setTabWidgets(data.tabWidgets);
                            if (data.tabs) setTabs(data.tabs);
                            alert('Settings imported successfully!');
                          } catch (error) {
                            alert('Error importing settings. Please check the file format.');
                          }
                        };
                        reader.readAsText(file);
                      }
                    };
                    input.click();
                    setShowSettings(false);
                  }}
                >
                  <div className="font-medium">Import</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Import dashboard settings from file</div>
                </button>
                
                
                <button 
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    alert('Widget Dashboard v1.0.0\n\nA customizable Firefox start page with widgets for productivity and organization.\n\nDeveloped with React, TypeScript, and Tailwind CSS.');
                    setShowSettings(false);
                  }}
                >
                  <div className="font-medium">About</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">About Widget Dashboard</div>
                </button>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        

        {/* Widget Zones */}
        {(() => {
          const activeTab = tabs.find(tab => tab.active);
          const currentWidgets = activeTab ? tabWidgets[activeTab.id] || {
            zone1: ['bookmarks', 'notes'],
            zone2: ['calendar', 'todo'],
            zone3: ['clock', 'calculator']
          } : {
            zone1: ['bookmarks', 'notes'],
            zone2: ['calendar', 'todo'],
            zone3: ['clock', 'calculator']
          };

          return (
            <div className="grid grid-cols-3 gap-3 lg:gap-5">
              <WidgetZone
                widgets={currentWidgets.zone1}
                onWidgetsChange={(newWidgets) => {
                  if (activeTab) {
                    setTabWidgets(prev => ({
                      ...prev,
                      [activeTab.id]: {
                        ...prev[activeTab.id],
                        zone1: newWidgets
                      }
                    }));
                  }
                }}
                renderWidget={(type, i) => renderWidget(type, 'zone1', i)}
              />
              <WidgetZone
                widgets={currentWidgets.zone2}
                onWidgetsChange={(newWidgets) => {
                  if (activeTab) {
                    setTabWidgets(prev => ({
                      ...prev,
                      [activeTab.id]: {
                        ...prev[activeTab.id],
                        zone2: newWidgets
                      }
                    }));
                  }
                }}
                renderWidget={(type, i) => renderWidget(type, 'zone2', i)}
              />
              <WidgetZone
                widgets={currentWidgets.zone3}
                onWidgetsChange={(newWidgets) => {
                  if (activeTab) {
                    setTabWidgets(prev => ({
                      ...prev,
                      [activeTab.id]: {
                        ...prev[activeTab.id],
                        zone3: newWidgets
                      }
                    }));
                  }
                }}
                renderWidget={(type, i) => renderWidget(type, 'zone3', i)}
              />
            </div>
          );
        })()}
      </div>
    </div>
  );
}
