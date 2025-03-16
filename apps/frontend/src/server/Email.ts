import { Email } from '../types/Email';

export const createEmail = async (user_id: string, to_email: string, subject: string, email_body: string): Promise<Email> => {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id, to_email, subject, email_body, status: 'sent' }),
  });
  
  if (!response.ok) {
    console.error('Failed to create email in backend but will not throw error', response);
  }

  return response.json();
};

export const getEmails = async (user_id: string) => {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/email/${user_id}`);

  if (!response.ok) {
    console.error('Failed to get emails in backend but will not throw error', response);
  }

  return response.json();
};
