export class ErrorWithDetails extends Error {
  details: string;
  suggestions: string[];
  code: string;

  constructor(message: string, details?: string, suggestions?: string[], code?: string) {
    super(message);
    this.name = 'ErrorWithDetails';
    this.details = details || '';
    this.suggestions = suggestions || [];
    this.code = code || 'UNKNOWN_ERROR';
  }
}