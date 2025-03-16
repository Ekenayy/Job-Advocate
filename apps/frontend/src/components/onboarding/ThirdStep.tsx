import React from 'react';
import { useUser } from '../../context/UserProvder';

interface ThirdStepProps {
  onNext: () => void;
}

const ThirdStep: React.FC<ThirdStepProps> = ({ onNext }) => {
  const { setHasSeenThirdStep } = useUser();

  const handleComplete = async () => {
    // Mark that the user has seen the third step
    await setHasSeenThirdStep(true);
    // Continue with onboarding completion
    onNext();
  };

  return (
    <div className="flex flex-col gap-6 p-4 w-full max-w-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">You're all set!</h1>
      </div>

      <p className="text-gray-600">Here's how it works:</p>

      <ol className="list-decimal pl-6 space-y-4">
        <li className="text-gray-600 font-bold">Visit any individual job posting</li>
        <li className="text-gray-600 font-bold">Search for advocates at the company</li>
        <li className="text-gray-600 font-bold">Use AI to write and send a perfect intro email in seconds</li>
      </ol>
      <p className="text-gray-600">Tip: We work best on individual job postings, not job listings with multiple jobs on the page.</p>

      <button
        onClick={handleComplete}
        className="w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Try it out
      </button>

      <div className="text-sm text-gray-600 text-center">
        Have questions or need help?{' '}
        <a href="#" className="text-blue-600 hover:underline">
          Contact us
        </a>
      </div>
    </div>
  );
};

export default ThirdStep;