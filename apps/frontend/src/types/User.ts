import { Resume } from "./Resume";

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
}
