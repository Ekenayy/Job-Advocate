import { Resume } from "../types/Resume";

export const getResume = async (user_id: string): Promise<Resume | null> => {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/resume/${user_id}`);

  if (!response.ok) {
    console.error('Failed to get resume in backend but will not throw error', response);
    return null;
  }

  return response.json();
};


