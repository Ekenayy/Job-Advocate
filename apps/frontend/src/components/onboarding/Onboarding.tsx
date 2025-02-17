import { useState } from "react";
import SecondStep from "./SecondStep";
import ThirdStep from "./ThirdStep";

interface OnboardingProps {
    setIsOnboardingComplete: (isOnboardingComplete: boolean) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ setIsOnboardingComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [jobTitle, setJobTitle] = useState('');
  const [resume, setResume] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    if (currentStep === 0) {
      setIsLoading(true);

      if (!resume) {
        setError('Please upload a resume');
        setIsLoading(false);
        return;
      }

      const formData = new FormData();

      formData.append('user_id', '86318221-2f8e-43e2-822c-2d76e94b7aad');
      formData.append('jobTitle', jobTitle);
      formData.append('resume', resume);

      // Save the data
      // chrome.storage.local.set({
      //   jobTitle,
      //   resume: resume ? resume.name : null
      // }, () => {
      //   // setCurrentStep(currentStep + 1);
      // });

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/resume`, {
          method: 'POST',
          body: formData
        });

        const resumeResponse = await response.json();

        console.log('resumeResponse:', resumeResponse);
        setIsLoading(false);
        setCurrentStep(currentStep + 1);
      } catch (error) {
        console.error('Error onboarding:', error);
        setError('Failed to upload resume');
        setIsLoading(false);
      }

    } else if (currentStep === 1) {
      setIsOnboardingComplete(true);
    } else {
      setCurrentStep(currentStep + 1);
    }
  }

  const steps = [
    <SecondStep 
      onNext={handleNext}
      jobTitle={jobTitle}
      setJobTitle={setJobTitle}
      resume={resume}
      setResume={setResume}
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