import { Resume } from "./Resume";

export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

export interface UserContextType {
  contextUser: User | null;
  contextResume: Resume | null;
  isOnboardingComplete: boolean;
  setContextUser: (user: User | null) => void;
  setContextResume: (resume: Resume | null) => void;
  setUser: (user: User) => Promise<void>;
  setResume: (resume: Resume) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}
