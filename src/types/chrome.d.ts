// Chrome extension types for components that need to work in both dev and extension environments

declare global {
  interface Window {
    chrome?: typeof chrome;
  }
}

// Extension-specific utility functions
export const isExtensionEnvironment = (): boolean => {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.runtime;
};

export const getStorage = () => {
  if (isExtensionEnvironment()) {
    return chrome.storage.local;
  }
  return {
    get: (keys: string[], callback: (result: any) => void) => {
      const result: any = {};
      if (Array.isArray(keys)) {
        keys.forEach(key => {
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              result[key] = JSON.parse(stored);
            } catch {
              result[key] = stored;
            }
          }
        });
      }
      callback(result);
    },
    set: (items: any, callback?: () => void) => {
      Object.keys(items).forEach(key => {
        localStorage.setItem(key, JSON.stringify(items[key]));
      });
      if (callback) callback();
    }
  };
};

export const sendMessage = (message: any, callback?: (response: any) => void) => {
  if (isExtensionEnvironment()) {
    chrome.runtime.sendMessage(message, callback);
  } else {
    // Fallback for development - simulate responses
    if (callback) {
      setTimeout(() => {
        if (message.action === 'getBookmarks') {
          const savedBookmarks = localStorage.getItem('widgetBookmarks');
          callback({ 
            bookmarks: savedBookmarks ? JSON.parse(savedBookmarks) : [] 
          });
        } else {
          callback({ success: true });
        }
      }, 10);
    }
  }
};

export {};
