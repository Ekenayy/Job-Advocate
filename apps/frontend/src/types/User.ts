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
  setContextUser: (user: User | null) => void;
  setContextResume: (resume: Resume | null) => void;
  setUser: (user: User) => void;
  setResume: (resume: Resume) => void;
}
