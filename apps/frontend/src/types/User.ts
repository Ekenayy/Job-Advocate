import { Resume } from "./Resume";
import { Employee } from "./Employee";
import { Email } from "./Email";
export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

export interface UserContextType {
  contextResume: Resume | null;
  isOnboardingComplete: boolean;
  setResume: (resume: Resume) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  lastAdvocates: Employee[];
  setLastContextAdvocates: (advocates: Employee[]) => Promise<void>;
  userEmails: Email[];
  setContextUserEmails: (emails: Email[]) => Promise<void>;
}
