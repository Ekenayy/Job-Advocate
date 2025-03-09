import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserContextType } from '../types/User';
import { Resume } from '../types/Resume';
import { getFromStorage, setToStorage, removeFromStorage } from '../utils/environment';
import { useUser as useClerkUser } from '@clerk/chrome-extension';
import { Employee } from '../types/Employee';
import { Email } from '../types/Email';
import { getEmails } from '../server/Email';
import { getResume } from '../server/Resume';
const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [contextResume, setContextResume] = useState<Resume | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [lastAdvocates, setLastAdvocates] = useState<Employee[]>([]);
  const [userEmails, setUserEmails] = useState<Email[]>([]);
  const { user, isSignedIn, isLoaded } = useClerkUser();
  const [previousSignInState, setPreviousSignInState] = useState<boolean | null>(null);

  const getStorageData = async () => {
    const resume = await getFromStorage<Resume>('resume');
    const onboardingStatus = await getFromStorage<boolean>('isOnboardingComplete');
    const lastAdvocates = await getFromStorage<Employee[]>('lastAdvocates');
    const userEmails = await getFromStorage<Email[]>('userEmails');
    const previousSignInState = await getFromStorage<boolean>('previousSignInState');
    
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

  // Clear user data from storage when user signs out
  const clearUserData = async () => {
    console.log('User signed out, clearing data from storage');
    await removeFromStorage('resume');
    await removeFromStorage('lastAdvocates');
    await removeFromStorage('userEmails');
    
    // Reset state
    setContextResume(null);
    setLastAdvocates([]);
    setUserEmails([]);
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
      setContextUserEmails
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

