const createEmail = async (user_id: string, to_email: string, subject: string, email_body: string) => {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/email`, {
    method: 'POST',
    body: JSON.stringify({ user_id, to_email, subject, email_body, status: 'sent' }),
  });
  
  if (!response.ok) {
    console.error('Failed to create email in backend but will not throw error', response);
  }

  return response.json();
};

export default createEmail;
