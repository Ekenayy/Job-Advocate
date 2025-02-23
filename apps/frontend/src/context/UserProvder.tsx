import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserContextType } from '../types/User';
import { Resume } from '../types/Resume';
import { getFromStorage, setToStorage } from '../utils/environment';

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [contextUser, setContextUser] = useState<User | null>(null);
  const [contextResume, setContextResume] = useState<Resume | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  const getStorageData = async () => {
    const resume = await getFromStorage<Resume>('resume');
    const user = await getFromStorage<User>('user');
    const onboardingStatus = await getFromStorage<boolean>('isOnboardingComplete');

    if (resume) setContextResume(resume);
    if (user) setContextUser(user);
    if (onboardingStatus) setIsOnboardingComplete(onboardingStatus);
  };

  const setResume = async (resume: Resume) => {
    setContextResume(resume);
    await setToStorage('resume', resume);
  };

  const setUser = async (user: User) => {
    setContextUser(user);
    await setToStorage('user', user);
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
      contextUser, 
      contextResume, 
      isOnboardingComplete,
      setContextUser, 
      setContextResume, 
      setUser, 
      setResume,
      completeOnboarding 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

