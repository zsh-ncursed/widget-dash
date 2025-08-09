/// <reference types="vite/client" />

// Browser extension types for cross-browser compatibility
interface BrowserAPI {
  runtime: {
    onInstalled: {
      addListener: (callback: () => void) => void;
    };
    onMessage: {
      addListener: (callback: (request: any, sender: any, sendResponse: (response: any) => void) => boolean | void) => void;
    };
    sendMessage: (message: any, callback?: (response: any) => void) => void;
  };
  storage: {
    local: {
      get: (keys: string[] | string | null, callback: (result: any) => void) => void;
      set: (items: any, callback?: () => void) => void;
    };
  };
  bookmarks?: {
    getTree: (callback: (bookmarkTreeNodes: any[]) => void) => void;
    create: (bookmark: { title: string; url: string }, callback: (bookmark: any) => void) => void;
    remove: (id: string, callback: () => void) => void;
  };
}

declare global {
  interface Window {
    browser?: BrowserAPI;
    chrome?: BrowserAPI;
  }
  
  // Firefox uses 'browser' global
  var browser: BrowserAPI | undefined;
  var chrome: BrowserAPI | undefined;
}
