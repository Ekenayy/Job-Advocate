export class GmailService {
  private static instance: GmailService;
  private accessToken: string | null = null;
  private tokenExpirationTime: number | null = null;
  private retryAttempts = 0; // Track retry attempts to prevent infinite loops

  private constructor() {
    // Try to restore the token from storage on initialization
    this.restoreToken();
  }

  static getInstance(): GmailService {
    if (!GmailService.instance) {
      GmailService.instance = new GmailService();
    }
    return GmailService.instance;
  }

  private async restoreToken(): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return;
    }

    const result = await chrome.storage.local.get(['gmailToken', 'tokenExpiration']);
    if (result.gmailToken && result.tokenExpiration) {
      // Check if token is still valid
      if (Date.now() < result.tokenExpiration) {
        this.accessToken = result.gmailToken;
        this.tokenExpirationTime = result.tokenExpiration;
      }
    }
  }

  private async saveToken(token: string): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return;
    }

    // Set expiration to 30 days from now
    const expirationTime = Date.now() + (30 * 24 * 60 * 60 * 1000);
    
    await chrome.storage.local.set({
      gmailToken: token,
      tokenExpiration: expirationTime
    });

    this.accessToken = token;
    this.tokenExpirationTime = expirationTime;
    
    // When we get a fresh token, reset retryAttempts counter
    this.retryAttempts = 0;
    
    // Clear validation timestamp when getting a new token
    if (chrome.storage) {
      await chrome.storage.local.remove(['gmailTokenLastValidated']);
    }
    
    console.log('Token saved successfully with expiration:', new Date(expirationTime).toLocaleString());
  }
  
  // Clear the token when it's invalid
  async invalidateToken(): Promise<void> {
    console.log('Invalidating token');
    
    this.accessToken = null;
    this.tokenExpirationTime = null;
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.remove(['gmailToken', 'tokenExpiration', 'gmailTokenLastValidated']);
    }
    
    // If we have a Chrome identity API, also remove from Chrome's token cache
    if (typeof chrome !== 'undefined' && chrome.identity && this.accessToken) {
      try {
        await new Promise<void>((resolve) => {
          chrome.identity.removeCachedAuthToken({ token: this.accessToken! }, () => {
            if (chrome.runtime.lastError) {
              console.warn('Error removing cached token:', chrome.runtime.lastError);
            }
            resolve();
          });
        });
      } catch (error) {
        console.warn('Error during token invalidation:', error);
      }
    }
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.accessToken || !this.tokenExpirationTime) {
      return false;
    }

    // Check if token is expired based on our stored expiration
    if (Date.now() >= this.tokenExpirationTime) {
      return false;
    }

    // Add a local validation cache to reduce network calls
    // Only validate with Google once per hour at most
    const lastValidationTime = await chrome.storage.local.get(['gmailTokenLastValidated']);
    const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
    
    if (lastValidationTime.gmailTokenLastValidated && 
        Date.now() - lastValidationTime.gmailTokenLastValidated < ONE_HOUR) {
      // Skip the network call if we've validated recently
      return true;
    }

    // Verify token is still valid with Google
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      const isValid = response.ok;
      
      // Store the validation time and result
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({
          gmailTokenLastValidated: Date.now()
        });
      }
      
      if (!isValid) {
        console.log('Token validation failed with status:', response.status);
        // If token is invalid, clear it so we get a fresh one next time
        await this.invalidateToken();
      }
      
      return isValid;
    } catch (error) {
      console.error('Token validation failed with error:', error);
      // If validation throws an error, invalidate the token
      await this.invalidateToken();
      return false;
    }
  }

  async authenticate(interactive: boolean = true): Promise<string> {
    // Check if we already have a valid token
    if (await this.isAuthenticated()) {
      return this.accessToken!;
    }

    // Development fallback
    if (typeof chrome === 'undefined' || !chrome.identity) {
      console.warn('Chrome extension APIs not available - using mock for development');
      const mockToken = 'mock_token';
      await this.saveToken(mockToken);
      return mockToken;
    }

    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive }, async (token) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting auth token:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        
        if (token) {
          await this.saveToken(token);
          resolve(token);
        } else {
          reject(new Error('Failed to get auth token'));
        }
      });
    });
  }
  
  // Add a method to explicitly refresh the token
  async refreshToken(): Promise<string> {
    if (typeof chrome === 'undefined' || !chrome.identity) {
      throw new Error('Chrome identity API not available');
    }
    
    // If we have a cached token, try to remove it first
    if (this.accessToken) {
      try {
        await new Promise<void>((resolve) => {
          chrome.identity.removeCachedAuthToken({ token: this.accessToken! }, () => {
            if (chrome.runtime.lastError) {
              console.warn('Error removing cached token:', chrome.runtime.lastError);
            }
            resolve();
          });
        });
      } catch (error) {
        console.warn('Error during token removal:', error);
      }
    }
    
    // Clear current token state
    await this.invalidateToken();
    
    // Get a fresh token
    return this.authenticate(true);
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    displayName?: string,
    isRetry: boolean = false
  ): Promise<{ status: string; message: string }> {
    try {
      // First try to get a token if we don't have one
      if (!this.accessToken) {
        try {
          console.log('No token available, authenticating...');
          await this.authenticate(false); // Try silent auth first
        } catch (error) {
          console.log('Silent authentication failed, trying interactive auth');
          await this.authenticate(true); // Fall back to interactive auth
        }
      }

      const emailContent = await this.createEmailRaw(
        to,
        subject,
        body,
        displayName
      );

      // Convert Unicode string to UTF-8 bytes, then to base64
      const encodedEmail = btoa(
        new TextEncoder().encode(emailContent)
          .reduce((str, byte) => str + String.fromCharCode(byte), '')
      )
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedEmail
        })
      });

      // Check for auth errors and retry automatically
      if (response.status === 401 || response.status === 403) {
        console.log('Got 401/403 error. Token appears to be invalid. Refreshing...');
        
        // Limit retry attempts to prevent infinite loops
        if (this.retryAttempts >= 2) {
          this.retryAttempts = 0;
          throw new Error(`Authentication failed after ${this.retryAttempts} attempts. Please try again later.`);
        }
        
        this.retryAttempts++;
        
        // Clear the token
        await this.invalidateToken();
        
        // Force a fresh token with interactive auth
        await this.authenticate(true);
        
        // Retry the email send with the new token
        console.log('Retrying email send with fresh token...');
        return this.sendEmail(to, subject, body, displayName, true);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to send email:', response.status, errorData);
        throw new Error(`Failed to send email: ${response.statusText} (${response.status})`);
      }

      // Reset retry counter on success
      this.retryAttempts = 0;
      
      return {
        status: 'success',
        message: 'Email sent successfully'
      }
    } catch (error) {
      // Handle specific auth errors that might not be caught by the 401 check
      if (!isRetry && error instanceof Error && (
          error.message.includes('token expired') || 
          error.message.includes('invalid credentials') ||
          error.message.includes('invalid_token') ||
          error.message.includes('unauthorized') ||
          error.message.includes('401') ||
          error.message.includes('403')
        )) {
        console.log('Detected auth error from error message. Refreshing token...');
        
        // Limit retry attempts
        if (this.retryAttempts >= 2) {
          this.retryAttempts = 0;
          throw new Error(`Authentication failed after ${this.retryAttempts} attempts. Please try again later.`);
        }
        
        this.retryAttempts++;
        
        // Clear token and get a new one
        await this.invalidateToken();
        await this.authenticate(true);
        
        // Retry the email send
        return this.sendEmail(to, subject, body, displayName, true);
      }
      
      // For non-auth errors or after we've already retried, just throw
      throw error;
    }
  }

  private async createEmailRaw(to: string, subject: string, body: string, displayName?: string): Promise<string> {
    // Get user info from Chrome identity
    const userInfo = await new Promise<chrome.identity.UserInfo>((resolve, reject) => {
      chrome.identity.getProfileUserInfo((userInfo) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(userInfo);
      });
    });

    const fromField = displayName 
      ? `From: ${displayName} <${userInfo.email}>\n`
      : `From: ${userInfo.email}\n`;

    const email = [
      'Content-Type: text/plain; charset="UTF-8"\n',
      'MIME-Version: 1.0\n',
      fromField,
      `To: ${to}\n`,
      `Subject: ${subject}\n\n`,
      body
    ].join('');

    return email;
  }
}