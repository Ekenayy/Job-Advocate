// Keep track of which tabs have content scripts loaded
const contentScriptTabs = new Set<number>();

// Helper function to find the content script file in the manifest
const findContentScriptFile = (): string | null => {
  try {
    // Get the manifest
    const manifest = chrome.runtime.getManifest();
    
    // Check if there are content scripts defined
    if (manifest.content_scripts && manifest.content_scripts.length > 0) {
      // Get the first content script's JS files
      const contentScriptFiles = manifest.content_scripts[0].js;
      
      if (contentScriptFiles && contentScriptFiles.length > 0) {
        // Return the first JS file
        return contentScriptFiles[0];
      }
    }
    
    // If we can't find it in the manifest, try some common patterns
    return "assets/content.tsx-loader-Ch3G1YwU.js";
  } catch (error) {
    console.error("Error finding content script file:", error);
    return null;
  }
};

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Track when content scripts are loaded
  if (message.action === "CONTENT_SCRIPT_READY" && sender.tab?.id) {
    contentScriptTabs.add(sender.tab.id);
    sendResponse({ status: "acknowledged" });
    return true;
  }
  
  // Handle opening the side panel
  if (message.action === "OPEN_SIDE_PANEL") {
    if (sender.tab?.windowId) {
      chrome.sidePanel.open({ windowId: sender.tab.windowId });
    } else {
      // If no window ID is available, try to open in the current window
      chrome.windows.getCurrent((window) => {
        if (window.id) {
          chrome.sidePanel.open({ windowId: window.id });
        }
      });
    }
    sendResponse({ status: "opened" });
    return true;
  }
  
  // Handle content script injection requests
  if (message.action === "INJECT_CONTENT_SCRIPT") {
    
    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs.length === 0 || !tabs[0].id) {
        console.error("No active tab found");
        sendResponse({ error: "No active tab found" });
        return;
      }
      
      const tabId = tabs[0].id;
      
      try {
        // Find the content script file
        const contentScriptFile = findContentScriptFile();
        
        if (!contentScriptFile) {
          console.error("Could not find content script file");
          sendResponse({ error: "Could not find content script file" });
          return;
        }
        
        // Inject the content script
        await chrome.scripting.executeScript({
          target: { tabId },
          files: [contentScriptFile]
        });
        
        contentScriptTabs.add(tabId);
        sendResponse({ status: "injected" });
      } catch (error) {
        console.error("Error injecting content script:", error);
        sendResponse({ error: `Error injecting content script: ${error}` });
      }
    });
    
    return true; // Indicate we'll respond asynchronously
  }
  
  // Forward job info from content script to side panel
  if (message.action === "JOB_INFO_RESULT" || message.action === "JOB_INFO_ERROR") {
    // Broadcast to all extension pages (side panel will pick this up)
    chrome.runtime.sendMessage(message);
    sendResponse({ status: "forwarded" });
    return true;
  }
  
  // Handle requests to get job info from the current tab
  if (message.action === "GET_JOB_INFO_FROM_TAB") {
    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error("No active tab found");
        sendResponse({ error: "No active tab found" });
        return;
      }
      
      const activeTab = tabs[0];
      
      if (!activeTab.id) {
        console.error("Active tab has no ID");
        sendResponse({ error: "Active tab has no ID" });
        return;
      }
      
      const tabId = activeTab.id; // Store in a constant to avoid undefined checks
      
      // First check if the content script is loaded in this tab
      if (!contentScriptTabs.has(tabId)) {
        // Try to ping the content script to see if it's actually loaded
        chrome.tabs.sendMessage(
          tabId,
          { action: "PING" },
          () => {
            if (chrome.runtime.lastError) {              
              // Content script is not loaded, try to inject it
              const contentScriptFile = findContentScriptFile();
              
              if (!contentScriptFile) {
                console.error("Could not find content script file");
                sendResponse({ error: "Could not find content script file" });
                return;
              }
              
              chrome.scripting.executeScript(
                {
                  target: { tabId },
                  files: [contentScriptFile]
                },
                () => {
                  if (chrome.runtime.lastError) {
                    console.error("Failed to inject content script:", chrome.runtime.lastError.message);
                    sendResponse({ 
                      error: "Failed to inject content script: " + chrome.runtime.lastError.message 
                    });
                  } else {
                    // Wait a moment for the content script to initialize
                    setTimeout(() => {
                      // Now try to get job info
                      chrome.tabs.sendMessage(
                        tabId,
                        { action: "GET_JOB_INFO" },
                        () => {
                          if (chrome.runtime.lastError) {
                            console.error("Error getting job info after injection:", chrome.runtime.lastError.message);
                            sendResponse({ 
                              error: "Error getting job info after injection: " + chrome.runtime.lastError.message 
                            });
                          } else {
                            sendResponse({ status: "requested" });
                          }
                        }
                      );
                    }, 500);
                  }
                }
              );
            } else {
              // Content script is loaded but not in our tracking set
              contentScriptTabs.add(tabId);
              
              // Now request job info
              chrome.tabs.sendMessage(
                tabId,
                { action: "GET_JOB_INFO" },
                () => {
                  if (chrome.runtime.lastError) {
                    console.error("Error getting job info:", chrome.runtime.lastError.message);
                    sendResponse({ 
                      error: "Error getting job info: " + chrome.runtime.lastError.message 
                    });
                  } else {
                    sendResponse({ status: "requested" });
                  }
                }
              );
            }
          }
        );
      } else {
        // Content script is loaded according to our tracking
        chrome.tabs.sendMessage(
          tabId,
          { action: "GET_JOB_INFO" },
          () => {
            if (chrome.runtime.lastError) {
              console.error("Error getting job info:", chrome.runtime.lastError.message);
              
              // Content script might have been unloaded, remove from tracking
              contentScriptTabs.delete(tabId);
              
              sendResponse({ 
                error: "Error getting job info: " + chrome.runtime.lastError.message 
              });
            } else {
              sendResponse({ status: "requested" });
            }
          }
        );
      }
    });
    
    return true; // Indicate we'll respond asynchronously
  }
  
  return false;
});

// Listen for tab updates to track when content scripts are loaded
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    // When a tab is fully loaded, remove it from our tracking set
    // The content script will re-add itself if it loads
    contentScriptTabs.delete(tabId);
  }
});

// Listen for tab removal to clean up our tracking set
chrome.tabs.onRemoved.addListener((tabId) => {
  contentScriptTabs.delete(tabId);
});

// Set up the side panel
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// When the extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install" || details.reason === "update") {
    // Set up the side panel
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error(error));
  }
});

