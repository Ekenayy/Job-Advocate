import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserContextType } from '../types/User';
import { Resume } from '../types/Resume';
import { getFromStorage, setToStorage } from '../utils/environment';
const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [contextUser, setContextUser] = useState<User | null>(null);
  const [contextResume, setContextResume] = useState<Resume | null>(null);

  const getStorageData = async () => {
    const resume = await getFromStorage<Resume>('resume');
    const user = await getFromStorage<User>('user');

    if (resume) setContextResume(resume);
    if (user) setContextUser(user);
  };

  const setResume = async (resume: Resume) => {
    setContextResume(resume);
    await setToStorage('resume', resume);
  };

  const setUser = async (user: User) => {
    setContextUser(user);
    await setToStorage('user', user);
  };

  useEffect(() => {
    getStorageData();
  }, []);

  return (
    <UserContext.Provider value={{ contextUser, contextResume, setContextUser, setContextResume, setUser, setResume }}>
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

