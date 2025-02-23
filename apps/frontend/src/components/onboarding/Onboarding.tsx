import { useState } from "react";
import SecondStep from "./SecondStep";
import ThirdStep from "./ThirdStep";
import { useUser } from "../../context/UserProvder";
interface OnboardingProps {
    setIsOnboardingComplete: (isOnboardingComplete: boolean) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ setIsOnboardingComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [jobTitle, setJobTitle] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { setResume } = useUser();

  const handleNext = async () => {
    if (currentStep === 0) {
      setIsLoading(true);

      if (!resumeFile) {
        setError('Please upload a resume');
        setIsLoading(false);
        return;
      }

      const formData = new FormData();

      formData.append('user_id', '86318221-2f8e-43e2-822c-2d76e94b7aad');
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
        setError('Failed to upload resume');
        setIsLoading(false);
      }

    } else if (currentStep === 1) {
      chrome.storage.local.set({
        isOnboardingComplete: true
      }, () => {
        setIsOnboardingComplete(true);
      });
    } else {
      setCurrentStep(currentStep + 1);
    }
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