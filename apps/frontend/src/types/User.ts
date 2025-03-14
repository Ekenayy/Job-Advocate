import { Resume } from "./Resume";
import { Employee } from "./Employee";
import { Email } from "./Email";

export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

export interface JobInfo {
  companyBackground: string;
  jobRequirements: string;
  companyName: string;
  potentialAdvocates: string[];
  domain?: string;
  jobTitle?: string;
}

export interface UserContextType {
  contextResume: Resume | null;
  isOnboardingComplete: boolean;
  lastAdvocates: Employee[];
  userEmails: Email[];
  setResume: (resume: Resume) => Promise<void>;
  completeOnboarding: () => Promise<boolean>;
  setLastContextAdvocates: (advocates: Employee[]) => Promise<void>;
  setContextUserEmails: (emails: Email[]) => Promise<void>;
  jobInfo: JobInfo;
  setJobInfo: (info: JobInfo) => Promise<void>;
  updateJobInfo: (info: Partial<JobInfo>) => Promise<void>;
  checkIfUserIsOnboarded: () => Promise<boolean>;
}