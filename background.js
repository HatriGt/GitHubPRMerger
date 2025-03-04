// background.js

// Listen for tab updates to detect GitHub PR pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Only run when the page is fully loaded
    if (changeInfo.status === 'complete') {
      // Check if the URL is a GitHub PR page
      if (tab.url && tab.url.match(/github\.com\/.*\/.*\/pull\/\d+/)) {
        // Set a badge on the extension icon
        chrome.action.setBadgeText({ 
          text: 'PR',
          tabId: tabId
        });
        
        chrome.action.setBadgeBackgroundColor({ 
          color: '#8957e5',
          tabId: tabId
        });
        
        // Optional: Add a tooltip when hovering over the extension icon
        chrome.action.setTitle({
          title: 'GitHub PR detected - Click to create branch merges',
          tabId: tabId
        });
      } else {
        // Clear the badge when not on a PR page
        chrome.action.setBadgeText({ 
          text: '',
          tabId: tabId
        });
        
        // Reset the tooltip
        chrome.action.setTitle({
          title: 'GitHub PR Branch Merger',
          tabId: tabId
        });
      }
    }
  });
  
  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'clearBadge') {
      // Clear the badge when the popup is opened
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
          chrome.action.setBadgeText({ 
            text: '',
            tabId: tabs[0].id
          });
        }
      });
    }
    
    // Always return true for async response
    return true;
  });