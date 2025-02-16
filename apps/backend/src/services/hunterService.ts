import { HUNTER_API_KEY } from '../constants';

interface HunterEmployee {
  first_name: string;
  last_name: string;
  position: string;
  seniority: string;
  email: string;
  linkedin_url?: string;
}

export const searchDomainEmployees = async (domain: string, jobTitle: string): Promise<HunterEmployee[]> => {
  try {
    const baseUrl = 'https://api.hunter.io/v2/domain-search';
    const positions = [jobTitle, 'founder', 'cofounder', 'co-founder', 'CEO'].join(',');
    
    const url = `${baseUrl}?domain=${domain}&api_key=${HUNTER_API_KEY}&position=${positions}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.errors?.[0] || 'Failed to fetch employees');
    }
    
    return data.data.emails.map((email: any) => ({
      first_name: email.first_name,
      last_name: email.last_name,
      position: email.position,
      seniority: email.seniority || 'unknown',
      email: email.value,
      linkedin_url: email.linkedin
    }));
  } catch (error) {
    console.error('Error fetching domain employees:', error);
    throw error;
  }
};