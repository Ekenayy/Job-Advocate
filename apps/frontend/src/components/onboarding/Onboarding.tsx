import { useState } from "react";
import SecondStep from "./SecondStep";

interface OnboardingProps {
    setIsOnboardingComplete: (isOnboardingComplete: boolean) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ setIsOnboardingComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [jobTitle, setJobTitle] = useState('');
  const [resume, setResume] = useState<File | null>(null);

  const handleNext = async () => {
    if (currentStep === 0) {
      const formData = new FormData();
      // formData.append('jobTitle', jobTitle);
      console.log('jobTitle:', jobTitle);

      formData.append('user_id', '86318221-2f8e-43e2-822c-2d76e94b7aad');
      formData.append('jobTitle', jobTitle);
      if (resume) {
        formData.append('resume', resume);
      }

      // Log all form data fields
      for (const [key, value] of formData.entries()) {
        console.log(`Form field - ${key}:`, value);
      }
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

        if (!response.ok) {
          throw new Error('Failed to onboard');
        }

        const data = await response.json();
        
        console.log('data:', data);
        
      } catch (error) {
        console.error('Error onboarding:', error);
      }


    } else {
      setCurrentStep(currentStep + 1);
    }
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  }

  const steps = [
    <SecondStep 
      onBack={handleBack} 
      onNext={handleNext}
      jobTitle={jobTitle}
      setJobTitle={setJobTitle}
      resume={resume}
      setResume={setResume}
    />,
  ];

  return (
    <div className="min-h-screen flex justify-center bg-white">
      {steps[currentStep]}
    </div>
  )
};