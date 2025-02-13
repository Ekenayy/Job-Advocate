/// <reference types="vite/client" />

console.log("Hello world from bakground script");

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'OPEN_SIDE_PANEL') {
    chrome.sidePanel.open({ windowId: sender.tab?.windowId ?? 0 })
      .catch((error) => console.error('Error opening side panel:', error));
  }
});

