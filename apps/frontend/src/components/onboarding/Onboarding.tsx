import { useState, useEffect, useRef } from "react";
import SecondStep from "./SecondStep";
import ThirdStep from "./ThirdStep";
import { useUser } from "../../context/UserProvder";
import { RingLoader } from "react-spinners";
import { GmailService } from "../../services/gmailService";

interface OnboardingProps {
    setIsOnboardingComplete: (isOnboardingComplete: boolean) => Promise<boolean>;
}

export const Onboarding: React.FC<OnboardingProps> = ({ setIsOnboardingComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [jobTitle, setJobTitle] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingResume, setHasExistingResume] = useState(false);
  const [isCheckingResume, setIsCheckingResume] = useState(true);

  const { setResume, user, contextResume } = useUser();

  // Check if user already has a resume
  useEffect(() => {
    const checkResume = async () => {
      setIsCheckingResume(true);
      try {
        if (contextResume) {
          setHasExistingResume(true);
          // If user already has a job title in their resume, use it
          if (contextResume.parsed_data?.job_title) {
            setJobTitle(contextResume.parsed_data.job_title as string);
          }
        }
      } catch (error) {
        console.error('Error checking resume:', error);
      } finally {
        setIsCheckingResume(false);
      }
    };
    
    checkResume();
  }, [contextResume]);

  const handleNext = async () => {
    if (currentStep === 0) {
      // If user already has a resume, skip the resume upload step
      if (hasExistingResume) {
        try {
          setIsLoading(true);
          setError(null);
          
          // Ensure we have a valid Gmail token
          const gmailService = GmailService.getInstance();
          let isAuthed = await gmailService.isAuthenticated();
          
          if (!isAuthed) {
            console.log('Token invalid before completing onboarding, attempting authentication...');
            try {
              await gmailService.authenticate(true); // Force interactive auth
              isAuthed = await gmailService.isAuthenticated();
              
              if (!isAuthed) {
                throw new Error('Authentication failed after interactive attempt');
              }
            } catch (error) {
              console.error('Authentication error:', error);
              setError('Unable to authenticate with Gmail. Please try reconnecting your account.');
              setIsLoading(false);
              return;
            }
          }
          
          // Now try to complete onboarding
          const success = await setIsOnboardingComplete(true);
          if (!success) {
            setError('Unable to complete onboarding. Please ensure you have connected your Gmail account.');
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error completing onboarding:', error);
          setError('Failed to complete onboarding. Please try again.');
          setIsLoading(false);
          return;
        }
        return;
      }

      // Otherwise, proceed with resume upload
      setIsLoading(true);
      setError(null);

      if (!resumeFile) {
        setError('Please upload a resume');
        setIsLoading(false);
        return;
      }

      const formData = new FormData();

      formData.append('user_id', user?.externalId || '');
      formData.append('jobTitle', jobTitle);
      formData.append('resume', resumeFile);

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/resume`, {
          method: 'POST',
          body: formData
        });

        const resumeResponse = await response.json();

        if (resumeResponse.error) {
          setError(resumeResponse.error);
          setIsLoading(false);
          return;
        }

        setResume(resumeResponse);
        setIsLoading(false);
        setCurrentStep(currentStep + 1);
      } catch (error) {
        console.error('Error onboarding:', error);
        setError('Failed to upload resume. Please try again.');
        setIsLoading(false);
      }

    } else if (currentStep === 1) {
      setIsLoading(true);
      setError(null);
      try {
        // Ensure we have a valid Gmail token before trying to complete onboarding
        const gmailService = GmailService.getInstance();
        let isAuthed = await gmailService.isAuthenticated();
        
        // If not authenticated, try to authenticate
        if (!isAuthed) {
          console.log('Token invalid before completing onboarding, attempting authentication...');
          try {
            // First try silent auth
            await gmailService.authenticate(false);
            isAuthed = await gmailService.isAuthenticated();
            
            // If silent auth failed, try interactive auth
            if (!isAuthed) {
              console.log('Silent authentication failed, trying interactive auth...');
              await gmailService.authenticate(true);
              isAuthed = await gmailService.isAuthenticated();
            }
            
            if (!isAuthed) {
              throw new Error('Authentication failed after multiple attempts');
            }
          } catch (error) {
            console.error('Authentication error:', error);
            setError('Unable to authenticate with Gmail. Please try reconnecting your account.');
            setIsLoading(false);
            return;
          }
        }
        
        // Now try to complete onboarding
        const success = await setIsOnboardingComplete(true);
        if (!success) {
          // Check what's missing
          const hasResume = !!contextResume;
          setError(
            !hasResume 
              ? 'Unable to complete onboarding. Your resume information is missing.' 
              : !isAuthed
                ? 'Unable to complete onboarding. Please ensure you have connected your Gmail account.'
                : 'Unable to complete onboarding. Please try again.'
          );
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error completing onboarding:', error);
        setError('Failed to complete onboarding. Please try again.');
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    } else {
      setCurrentStep(currentStep + 1);
    }
  }

  // Show loading spinner while checking resume status
  if (isCheckingResume) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <RingLoader color="#155dfc" size={60} />
        <p className="mt-4 text-gray-600">Setting up your account...</p>
      </div>
    );
  }

  const steps = [
    <SecondStep 
      onNext={handleNext}
      jobTitle={jobTitle}
      setJobTitle={setJobTitle}
      resumeFile={resumeFile}
      setResumeFile={setResumeFile}
      error={error}
      isLoading={isLoading}
      hasExistingResume={hasExistingResume}
    />,
    <ThirdStep 
      onNext={handleNext}
    />
  ];

  return (
    <div className="min-h-screen flex justify-center">
      {steps[currentStep]}
    </div>
  )
};