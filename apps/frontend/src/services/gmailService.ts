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
    const expirationTime = Date.now() + (30 * 24 * 60 * 60 * 1000);
    
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

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    displayName?: string
  ): Promise<{ status: string; message: string }> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
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

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.statusText}`);
      }

      return {
        status: 'success',
        message: 'Email sent successfully'
      }
    } catch (error) {
      if (error instanceof Error && (error.message.includes('token expired') || error.message.includes('invalid credentials'))) {
        this.accessToken = null;
        await this.authenticate();
        return this.sendEmail(to, subject, body, displayName);
      }
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