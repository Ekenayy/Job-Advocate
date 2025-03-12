import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserContextType, JobInfo } from '../types/User';
import { Resume } from '@/types/Resume';
import { Employee } from '../types/Employee';
import { Email } from '../types/Email';
import { getFromStorage, setToStorage, removeFromStorage } from '../utils/environment';
import { useUser as useClerkUser } from '@clerk/chrome-extension';
import { getEmails } from '../server/Email';
import { getResume } from '../server/Resume';

const UserContext = createContext<UserContextType | undefined>(undefined);

// Default job info state
const defaultJobInfo: JobInfo = {
  companyBackground: "",
  jobRequirements: "",
  companyName: "",
  potentialAdvocates: []
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [contextResume, setContextResume] = useState<Resume | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [lastAdvocates, setLastAdvocates] = useState<Employee[]>([]);
  const [userEmails, setUserEmails] = useState<Email[]>([]);
  const [jobInfo, setJobInfoState] = useState<JobInfo>(defaultJobInfo);
  const { user, isSignedIn, isLoaded } = useClerkUser();
  const [previousSignInState, setPreviousSignInState] = useState<boolean | null>(null);

  const getStorageData = async () => {
    const resume = await getFromStorage<Resume>('resume');
    const onboardingStatus = await getFromStorage<boolean>('isOnboardingComplete');
    const lastAdvocates = await getFromStorage<Employee[]>('lastAdvocates');
    const userEmails = await getFromStorage<Email[]>('userEmails');
    const previousSignInState = await getFromStorage<boolean>('previousSignInState');
    const storedJobInfo = await getFromStorage<JobInfo>('jobInfo');
    
    if (resume) setContextResume(resume);

    if (!resume && user?.externalId) {
      const fetchedResume = await getResume(user.externalId);
      if (fetchedResume) {
        setResume(fetchedResume);
      } else {
        setIsOnboardingComplete(false);
      }
    } else if (onboardingStatus) setIsOnboardingComplete(onboardingStatus);
    
    if (lastAdvocates) setLastAdvocates(lastAdvocates);
    if (userEmails) setUserEmails(userEmails);
    if (previousSignInState) setPreviousSignInState(previousSignInState);
    if (storedJobInfo) setJobInfoState(storedJobInfo);

    if (!userEmails && user?.externalId) {
      const emails = await getEmails(user.externalId);
      setContextUserEmails(emails);
    }
  };

  const setResume = async (resume: Resume) => {
    setContextResume(resume);
    await setToStorage('resume', resume);
  };

  const completeOnboarding = async () => {
    setIsOnboardingComplete(true);
    await setToStorage('isOnboardingComplete', true);
  };

  const setLastContextAdvocates = async (advocates: Employee[]) => {
    setLastAdvocates(advocates);
    await setToStorage('lastAdvocates', advocates);
  };

  const setContextUserEmails = async (emails: Email[]) => {
    setUserEmails(emails);
    await setToStorage('userEmails', emails);
  };

  // New function to set job info
  const setJobInfo = async (info: JobInfo) => {
    setJobInfoState(info);
    await setToStorage('jobInfo', info);
  };

  // New function to update partial job info
  const updateJobInfo = async (info: Partial<JobInfo>) => {
    const updatedInfo = { ...jobInfo, ...info };
    setJobInfoState(updatedInfo);
    await setToStorage('jobInfo', updatedInfo);
  };

  // Clear user data from storage when user signs out
  const clearUserData = async () => {
    console.log('User signed out, clearing data from storage');
    await removeFromStorage('resume');
    await removeFromStorage('lastAdvocates');
    await removeFromStorage('userEmails');
    await removeFromStorage('jobInfo');
    
    // Reset state
    setContextResume(null);
    setLastAdvocates([]);
    setUserEmails([]);
    setJobInfoState(defaultJobInfo);
  };

  useEffect(() => {
    getStorageData();
  }, [isLoaded]);

  // Monitor auth state changes to detect sign out
  useEffect(() => {
    // Only run this effect after Clerk has loaded
    if (isLoaded) {
      console.log('isLoaded', isLoaded);
      console.log('previousSignInState', previousSignInState);
      console.log('isSignedIn', isSignedIn);
      // If previously signed in and now signed out, clear data
      if (previousSignInState === true && !isSignedIn) {
        console.log('clearing user data...');
        clearUserData();
      }
      
      // Update previous state for next comparison
      setPreviousSignInState(isSignedIn);
      setToStorage('previousSignInState', isSignedIn);
    }
  }, [isSignedIn, isLoaded, previousSignInState]);

  return (
    <UserContext.Provider value={{ 
      contextResume, 
      isOnboardingComplete,
      setResume,
      completeOnboarding,
      lastAdvocates,
      setLastContextAdvocates,
      userEmails,
      setContextUserEmails,
      jobInfo,
      setJobInfo,
      updateJobInfo
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  const { user, isLoaded, isSignedIn } = useClerkUser();

  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return { 
    ...context, 
    user, 
    isLoaded, 
    isSignedIn,
  };
};

