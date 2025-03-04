import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserContextType } from '../types/User';
import { Resume } from '../types/Resume';
import { getFromStorage, setToStorage } from '../utils/environment';
import { useUser as useClerkUser } from '@clerk/chrome-extension';

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [contextResume, setContextResume] = useState<Resume | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  const getStorageData = async () => {
    const resume = await getFromStorage<Resume>('resume');
    const onboardingStatus = await getFromStorage<boolean>('isOnboardingComplete');

    if (resume) setContextResume(resume);
    if (onboardingStatus) setIsOnboardingComplete(onboardingStatus);
  };

  const setResume = async (resume: Resume) => {
    setContextResume(resume);
    await setToStorage('resume', resume);
  };


  const completeOnboarding = async () => {
    setIsOnboardingComplete(true);
    await setToStorage('isOnboardingComplete', true);
  };

  useEffect(() => {
    getStorageData();
  }, []);

  return (
    <UserContext.Provider value={{ 
      contextResume, 
      isOnboardingComplete,
      setResume,
      completeOnboarding 
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
    isSignedIn 
  };
};

