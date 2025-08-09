// Background script for Widget Dashboard extension

// Cross-browser compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Initialize extension settings
browserAPI.storage.onChanged.addListener((changes, namespace) => {
  console.log('Storage changed:', changes, namespace);
});

// Handle bookmark permissions
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  
  if (request.action === 'getBookmarks') {
    if (browserAPI.bookmarks) {
      browserAPI.bookmarks.getTree((bookmarkTreeNodes) => {
        console.log('Bookmarks loaded:', bookmarkTreeNodes);
        sendResponse({ bookmarks: bookmarkTreeNodes });
      });
      return true; // Keep message channel open for async response
    } else {
      sendResponse({ bookmarks: [] });
    }
  }
  
  if (request.action === 'createBookmark') {
    if (browserAPI.bookmarks) {
      browserAPI.bookmarks.create({
        title: request.title,
        url: request.url
      }, (bookmark) => {
        console.log('Bookmark created:', bookmark);
        sendResponse({ success: true, bookmark });
      });
      return true;
    } else {
      sendResponse({ success: false, error: 'Bookmarks API not available' });
    }
  }
  
  if (request.action === 'removeBookmark') {
    if (browserAPI.bookmarks) {
      browserAPI.bookmarks.remove(request.id, () => {
        console.log('Bookmark removed:', request.id);
        sendResponse({ success: true });
      });
      return true;
    } else {
      sendResponse({ success: false, error: 'Bookmarks API not available' });
    }
  }
  
  if (request.action === 'getStorage') {
    browserAPI.storage.local.get(request.keys || null, (result) => {
      console.log('Storage data:', result);
      sendResponse(result);
    });
    return true;
  }
  
  if (request.action === 'setStorage') {
    browserAPI.storage.local.set(request.data, () => {
      console.log('Storage set:', request.data);
      sendResponse({ success: true });
    });
    return true;
  }
});
