import React, { useState, useEffect } from 'react';
import { PropagateLoader } from 'react-spinners';
import { GmailService } from '../../services/gmailService';

interface SecondStepProps {
  onNext: () => void;
  jobTitle: string;
  setJobTitle: (title: string) => void;
  resume: File | null;
  setResume: (file: File | null) => void;
  error?: string | null;
  isLoading?: boolean;
}

const SecondStep: React.FC<SecondStepProps> = ({ onNext, jobTitle, setJobTitle, resume, setResume, error, isLoading }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const gmailService = GmailService.getInstance();
      const isAuthed = await gmailService.isAuthenticated();
      setIsAuthenticated(isAuthed);
    };
    checkAuth();
  }, []);

  const handleGmailAuth = async () => {
    setIsAuthenticating(true);
    try {
      const gmailService = GmailService.getInstance();
      await gmailService.authenticate();
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Gmail authentication failed:', error);
      // Show error to user
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResume(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 w-full max-w-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Welcome, let's setup your account</h1>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-600">What job title are you looking for?</label>
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
          Connect your Gmail account to send emails
        </label>
        <button
          onClick={handleGmailAuth}
          disabled={isAuthenticating || isAuthenticated}
          className={`w-full p-2 rounded-md ${
            isAuthenticated 
              ? 'bg-green-500 text-white' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isAuthenticating ? (
            <PropagateLoader color="#ffffff" size={10} className="p-3" />
          ) : isAuthenticated ? (
            '✓ Gmail Connected'
          ) : (
            'Connect Gmail'
          )}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-600">
          Upload your resume to help AI generate more custom emails (Optional)
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

      <div className="flex">
        <button
          onClick={onNext}
          disabled={isLoading || !isAuthenticated}
          className="flex-1 p-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300"
        >
          {isLoading ? (
            <PropagateLoader color="#ffffff" size={10} className="p-3" />
          ) : (
            'Complete Setup'
          )}
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default SecondStep;