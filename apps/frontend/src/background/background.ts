console.log("Background script initialized");

// Set up the side panel behavior
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Error setting panel behavior:", error));

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background script received message:", message);
  
  if (message.action === 'OPEN_SIDE_PANEL' && sender.tab) {
    chrome.sidePanel.open({ windowId: sender.tab.windowId })
      .then(() => {
        console.log('Side panel opened successfully');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Error opening side panel:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Required for async response
  }
  return false;
});

// Listen for installation events
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details.reason);
});

