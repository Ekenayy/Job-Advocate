/**
 * Checks if the current environment is a Chrome extension
 * @returns boolean indicating if running in Chrome extension context
 */
export const isChromeExtension = (): boolean => {
  return window.chrome !== undefined && !!chrome.storage;
};

/**
 * Gets data from the appropriate storage (Chrome storage or localStorage)
 * @param key The key to retrieve from storage
 * @returns Promise that resolves with the data or null if not found
 */
export const getFromStorage = async <T>(key: string): Promise<T | null> => {
  if (isChromeExtension()) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || null);
      });
    });
  }
  
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};

/**
 * Sets data in the appropriate storage (Chrome storage or localStorage)
 * @param key The key to store the data under
 * @param value The data to store
 */
export const setToStorage = async <T>(key: string, value: T): Promise<void> => {
  if (isChromeExtension()) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  }
  
  localStorage.setItem(key, JSON.stringify(value));
};

export const removeFromStorage = async (key: string): Promise<void> => {
  if (isChromeExtension()) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(key, resolve);
    });
  }

  localStorage.removeItem(key);
};