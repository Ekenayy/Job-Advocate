export class GmailService {
  private static instance: GmailService;
  private accessToken: string | null = null;
  private tokenExpirationTime: number | null = null;

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

    // Set expiration to 1 hour from now (adjust this to 30 days later)
    const expirationTime = Date.now() + (60 * 60 * 1000);
    
    await chrome.storage.local.set({
      gmailToken: token,
      tokenExpiration: expirationTime
    });

    this.accessToken = token;
    this.tokenExpirationTime = expirationTime;
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.accessToken || !this.tokenExpirationTime) {
      return false;
    }

    // Check if token is expired
    if (Date.now() >= this.tokenExpirationTime) {
      return false;
    }

    // Verify token is still valid with Google
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  async authenticate(): Promise<string> {
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
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError) {
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

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    const message = {
      raw: this.createEmailRaw(to, subject, body)
    };

    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }
  }

  private createEmailRaw(to: string, subject: string, body: string): string {
    const email = [
      'Content-Type: text/plain; charset="UTF-8"\n',
      'MIME-Version: 1.0\n',
      `To: ${to}\n`,
      `Subject: ${subject}\n\n`,
      body
    ].join('');

    return btoa(email)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}