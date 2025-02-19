import { google } from 'googleapis';

export class GmailService {
  private static instance: GmailService;
  private accessToken: string | null = null;

  private constructor() {}

  static getInstance(): GmailService {
    if (!GmailService.instance) {
      GmailService.instance = new GmailService();
    }
    return GmailService.instance;
  }

  async authenticate(): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        this.accessToken = token || null;
        resolve(token || '');
      });
    });
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    const gmail = google.gmail({ version: 'v1', auth: this.accessToken as string });
    
    // Create email in RFC 2822 format
    const email = [
      'Content-Type: text/plain; charset="UTF-8"\n',
      'MIME-Version: 1.0\n',
      `To: ${to}\n`,
      `Subject: ${subject}\n\n`,
      body
    ].join('');

    const encodedEmail = Buffer.from(email).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });
  }
}