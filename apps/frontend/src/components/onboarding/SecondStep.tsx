import React from 'react';

interface SecondStepProps {
  onNext: () => void;
  onBack: () => void;
  jobTitle: string;
  setJobTitle: (title: string) => void;
  resume: File | null;
  setResume: (file: File | null) => void;
}

const SecondStep: React.FC<SecondStepProps> = ({ onNext, onBack, jobTitle, setJobTitle, resume, setResume }) => {

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResume(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 w-full max-w-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Welcome Ekene, let's setup your account</h1>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-600">What's job title are you looking for?</label>
        <input
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="Enter job title"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-600">
          Would you like to upload your resume to help AI generate more custom emails? (Optional)
        </label>
        <label className="cursor-pointer w-full p-2 border rounded-md text-center bg-white hover:bg-gray-50">
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
            className="hidden"
          />
          {resume ? resume.name : 'Upload Resume'}
        </label>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 p-2 border border-blue-600 text-blue-600 rounded-md"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!jobTitle}
          className="flex-1 p-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default SecondStep;