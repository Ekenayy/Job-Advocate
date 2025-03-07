import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserContextType } from '../types/User';
import { Resume } from '../types/Resume';
import { getFromStorage, setToStorage } from '../utils/environment';
import { useUser as useClerkUser } from '@clerk/chrome-extension';
import { Employee } from '../types/Employee';
import { Email } from '../types/Email';
import { getEmails } from '../server/Email';
const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [contextResume, setContextResume] = useState<Resume | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [lastAdvocates, setLastAdvocates] = useState<Employee[]>([]);
  const [userEmails, setUserEmails] = useState<Email[]>([]);

  const getStorageData = async () => {
    const resume = await getFromStorage<Resume>('resume');
    const onboardingStatus = await getFromStorage<boolean>('isOnboardingComplete');
    const lastAdvocates = await getFromStorage<Employee[]>('lastAdvocates');
    const userEmails = await getFromStorage<Email[]>('userEmails');

    if (resume) setContextResume(resume);
    if (onboardingStatus) setIsOnboardingComplete(onboardingStatus);
    if (lastAdvocates) setLastAdvocates(lastAdvocates);
    if (userEmails) setUserEmails(userEmails);

    if (!userEmails) {
      const emails = await getEmails('86318221-2f8e-43e2-822c-2d76e94b7aad');
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

  useEffect(() => {
    getStorageData();
  }, []);

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

