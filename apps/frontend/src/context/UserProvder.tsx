import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserContextType, JobInfo } from '../types/User';
import { Resume } from '@/types/Resume';
import { Employee } from '../types/Employee';
import { Email } from '../types/Email';
import { getFromStorage, setToStorage, removeFromStorage } from '../utils/environment';
import { useUser as useClerkUser } from '@clerk/chrome-extension';
import { getEmails } from '../server/Email';
import { getResume } from '../server/Resume';
import { GmailService } from '../services/gmailService';

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
  const [hasSeenThirdStep, setHasSeenThirdStep] = useState(false);
  const [lastAdvocates, setLastAdvocates] = useState<Employee[]>([]);
  const [userEmails, setUserEmails] = useState<Email[]>([]);
  const [jobInfo, setJobInfoState] = useState<JobInfo>(defaultJobInfo);
  const { user, isSignedIn, isLoaded } = useClerkUser();
  const [previousSignInState, setPreviousSignInState] = useState<boolean | null>(null);

  /**
   * Checks if a user is fully onboarded by verifying they have both:
   * 1. A resume
   * 2. A valid Gmail token
   * 3. Has seen the third step of onboarding
   * @returns Promise that resolves to true if user is fully onboarded
   */
  const checkUserOnboardingStatus = async (resume: Resume | null): Promise<boolean> => {
    // First check if we have a stored onboarding status
    const storedOnboardingStatus = await getFromStorage<boolean>('isOnboardingComplete');
    const storedHasSeenThirdStep = await getFromStorage<boolean>('hasSeenThirdStep');
    
    // Update the hasSeenThirdStep state
    if (storedHasSeenThirdStep === true) {
      setHasSeenThirdStep(true);
    }
    
    // If we have a stored status of true, check if the conditions are still valid
    if (storedOnboardingStatus === true) {
      // Verify resume exists
      const hasResume = !!resume;
      
      // Verify Gmail token is valid
      const gmailService = GmailService.getInstance();
      const hasValidGmailToken = await gmailService.isAuthenticated();
      
      // User is onboarded if all conditions are met
      const isFullyOnboarded = hasResume && hasValidGmailToken && storedHasSeenThirdStep === true;
      
      // If status has changed, update storage
      if (!isFullyOnboarded) {
        await setToStorage('isOnboardingComplete', false);
      }
      
      return isFullyOnboarded;
    }
    
    // If no stored status or it's false, check if conditions are now met
    if (resume) {
      const gmailService = GmailService.getInstance();
      const hasValidGmailToken = await gmailService.isAuthenticated();
      
      if (hasValidGmailToken && storedHasSeenThirdStep === true) {
        // If all conditions are met, update storage and return true
        await setToStorage('isOnboardingComplete', true);
        return true;
      }
    }
    
    return false;
  };

  const getStorageData = async () => {
    const resume = await getFromStorage<Resume>('resume');
    const lastAdvocates = await getFromStorage<Employee[]>('lastAdvocates');
    const userEmails = await getFromStorage<Email[]>('userEmails');
    const previousSignInState = await getFromStorage<boolean>('previousSignInState');
    const storedJobInfo = await getFromStorage<JobInfo>('jobInfo');
    const storedHasSeenThirdStep = await getFromStorage<boolean>('hasSeenThirdStep');
    
    if (resume) setContextResume(resume);
    if (storedHasSeenThirdStep === true) setHasSeenThirdStep(true);

    if (!resume && user?.externalId) {
      const fetchedResume = await getResume(user.externalId);
      if (fetchedResume) {
        setResume(fetchedResume);
        // Check onboarding status with the fetched resume
        const onboardingStatus = await checkUserOnboardingStatus(fetchedResume);
        setIsOnboardingComplete(onboardingStatus);
      } else {
        setIsOnboardingComplete(false);
      }
    } else {
      // Check onboarding status with the stored resume
      const onboardingStatus = await checkUserOnboardingStatus(resume);
      setIsOnboardingComplete(onboardingStatus);
    }
    
    if (lastAdvocates) setLastAdvocates(lastAdvocates);
    if (userEmails) setUserEmails(userEmails);
    if (previousSignInState !== null) setPreviousSignInState(previousSignInState);
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

  // Update the completeOnboarding function to verify conditions are met
  const completeOnboarding = async (forceComplete: boolean = false) => {
    // Mark that the user has seen the third step
    setHasSeenThirdStep(true);
    await setToStorage('hasSeenThirdStep', true);
    
    // If forceComplete is true, bypass checks (used for debugging)
    if (forceComplete) {
      setIsOnboardingComplete(true);
      await setToStorage('isOnboardingComplete', true);
      console.log('Onboarding completed with force flag');
      return true;
    }

    // Check for resume
    if (!contextResume) {
      console.warn('Cannot complete onboarding: missing resume');
      return false;
    }

    // Check for Gmail token validity with detailed logging
    console.log('Verifying Gmail token before completing onboarding');
    const gmailService = GmailService.getInstance();
    
    try {
      let hasValidGmailToken = await gmailService.isAuthenticated();
      console.log('Initial token validation result:', hasValidGmailToken);
      
      // If token is not valid, try to authenticate
      if (!hasValidGmailToken) {
        console.log('Initial Gmail token check failed, attempting authentication...');
        try {
          // Try silent auth first
          await gmailService.authenticate(false);
          // Check again after authentication attempt
          hasValidGmailToken = await gmailService.isAuthenticated();
          console.log('Silent authentication result:', hasValidGmailToken ? 'success' : 'failed');
          
          // If silent auth failed, we'll let the caller handle interactive auth
          // instead of automatically triggering it here
        } catch (error) {
          console.error('Error during silent authentication:', error);
          // Continue with the result of the token check
        }
      }
      
      // If we have a resume and valid token, complete onboarding
      if (contextResume && hasValidGmailToken) {
        console.log('All conditions met, marking onboarding as complete');
        setIsOnboardingComplete(true);
        await setToStorage('isOnboardingComplete', true);
        return true;
      }
      
      // If conditions aren't met, don't mark as complete
      console.warn('Cannot complete onboarding:', {
        hasResume: !!contextResume,
        hasValidGmailToken
      });
      return false;
    } catch (error) {
      console.error('Error checking Gmail authentication:', error);
      return false;
    }
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
    await removeFromStorage('resume');
    await removeFromStorage('lastAdvocates');
    await removeFromStorage('userEmails');
    await removeFromStorage('jobInfo');
    await removeFromStorage('gmailToken');
    await removeFromStorage('tokenExpiration');
    await removeFromStorage('gmailTokenLastValidated');
    await removeFromStorage('gmailAuthLastChecked');
    await removeFromStorage('tokenExpiration');
    // Don't remove hasSeenThirdStep - users shouldn't have to repeat this step
    // await removeFromStorage('hasSeenThirdStep');
    
    // Reset state
    setContextResume(null);
    setLastAdvocates([]);
    setUserEmails([]);
    setJobInfoState(defaultJobInfo);
    // Don't reset hasSeenThirdStep
    // setHasSeenThirdStep(false);
  };

  useEffect(() => {
    getStorageData();
  }, [isLoaded]);

  // Monitor auth state changes to detect sign out
  useEffect(() => {
    // Only run this effect after Clerk has loaded
    if (isLoaded) {
      // If previously signed in and now signed out, clear data
      if (previousSignInState === true && !isSignedIn) {
        clearUserData();
      }
      
      // Update previous state for next comparison
      setPreviousSignInState(isSignedIn);
      setToStorage('previousSignInState', isSignedIn);
    }
  }, [isSignedIn, isLoaded, previousSignInState]);

  // Add a new function to check if user is onboarded
  const checkIfUserIsOnboarded = async (): Promise<boolean> => {
    // Check if we have a resume
    const hasResume = !!contextResume;
    
    // Check if Gmail token is valid
    const gmailService = GmailService.getInstance();
    const hasValidGmailToken = await gmailService.isAuthenticated();
    
    // Check if user has seen the third step
    const storedHasSeenThirdStep = await getFromStorage<boolean>('hasSeenThirdStep');
    if (storedHasSeenThirdStep === true) {
      setHasSeenThirdStep(true);
    }
    
    // User is onboarded if all conditions are met
    const isOnboarded = hasResume && hasValidGmailToken && (hasSeenThirdStep || storedHasSeenThirdStep === true);
    
    // Update state and storage if needed
    if (isOnboardingComplete !== isOnboarded) {
      setIsOnboardingComplete(isOnboarded);
      await setToStorage('isOnboardingComplete', isOnboarded);
    }
    
    return isOnboarded;
  };

  return (
    <UserContext.Provider value={{ 
      contextResume, 
      isOnboardingComplete,
      hasSeenThirdStep,
      setHasSeenThirdStep: async (value: boolean) => {
        setHasSeenThirdStep(value);
        await setToStorage('hasSeenThirdStep', value);
      },
      setResume,
      completeOnboarding,
      lastAdvocates,
      setLastContextAdvocates,
      userEmails,
      setContextUserEmails,
      jobInfo,
      setJobInfo,
      updateJobInfo,
      checkIfUserIsOnboarded
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
