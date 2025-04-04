import React, { useState, useEffect } from 'react';
import { PropagateLoader, RingLoader } from 'react-spinners';
import { GmailService } from '../../services/gmailService';

interface SecondStepProps {
  onNext: () => void;
  jobTitle: string;
  setJobTitle: (title: string) => void;
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  error?: string | null;
  isLoading?: boolean;
  hasExistingResume?: boolean;
}

const SecondStep: React.FC<SecondStepProps> = ({ 
  onNext, 
  jobTitle, 
  setJobTitle, 
  resumeFile, 
  setResumeFile, 
  error, 
  isLoading,
  hasExistingResume = false
}) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [_authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      try {
        const gmailService = GmailService.getInstance();
        const isAuthed = await gmailService.isAuthenticated();
        setIsAuthenticated(isAuthed);
      } catch (error) {
        console.error('Error checking Gmail authentication:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handleGmailAuth = async () => {
    setIsAuthenticating(true);
    try {
      const gmailService = GmailService.getInstance();
      
      // First try to invalidate any existing token that might be causing issues
      try {
        await gmailService.invalidateToken();
        console.log('Successfully invalidated previous token');
      } catch (error) {
        console.warn('Error while invalidating token, continuing anyway:', error);
      }
      
      // Force interactive authentication to ensure we get a fresh token
      console.log('Starting interactive authentication...');
      await gmailService.authenticate(true);
      
      // Verify that the new token is valid
      const isAuthed = await gmailService.isAuthenticated();
      console.log('Authentication result:', isAuthed ? 'success' : 'failed');
      setIsAuthenticated(isAuthed);
      
      if (!isAuthed) {
        throw new Error('Authentication succeeded but token validation failed');
      }
    } catch (error) {
      console.error('Gmail authentication failed:', error);
      // Extract user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('user_cancelled')) {
          setAuthError('Authentication was cancelled. Please try again.');
        } else if (error.message.includes('popup_blocked')) {
          setAuthError('Pop-up was blocked. Please allow pop-ups for this site and try again.');
        } else if (error.message.includes('Authorization page could not be loaded')) {
          setAuthError('Google authorization page could not be loaded. Please check your internet connection and try again.');
        } else if (error.message.includes('OAuth2 request failed')) {
          setAuthError('Authentication request failed. Please try again later.');
        } else {
          setAuthError(`Authentication failed: ${error.message}`);
        }
      } else {
        setAuthError('Authentication failed for an unknown reason. Please try again.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  // Determine if the user can proceed
  const canProceed = isAuthenticated && (hasExistingResume || (!!resumeFile && !!jobTitle.trim()));
  
  // Generate helper text based on what's missing
  const getHelperText = () => {
    if (!isAuthenticated) return "Please connect your Gmail account";
    if (!hasExistingResume) {
      if (!resumeFile) return "Please upload your resume";
      if (!jobTitle.trim()) return "Please enter a job title";
    }
    return "";
  };

  // Determine the title based on whether user has existing resume
  const title = hasExistingResume 
    ? "Reconnect your Gmail account" 
    : "Welcome, let's setup your account";

  // Show loading spinner while checking authentication status
  if (isCheckingAuth) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-64">
        <RingLoader color="#155dfc" size={60} />
        <p className="mt-4 text-gray-600">Checking your Gmail connection...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 w-full max-w-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      {/* Only show job title input if user doesn't have an existing resume */}
      {!hasExistingResume && (
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
      )}

      {/* Always show Gmail connection section */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-600">
          {hasExistingResume 
            ? "Your Gmail token has expired. Please reconnect your account to continue." 
            : "Connect your Gmail account to send emails"}
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

      {/* Only show resume upload if user doesn't have an existing resume */}
      {!hasExistingResume && (
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600">
            Upload your resume to help AI generate more custom emails. We use your resume to personalize the emails we send to advocates. Your resume will never be shared with anyone. 
          </label>
          <label className="cursor-pointer w-full p-2 border rounded-md text-center bg-white hover:bg-gray-50">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              className="hidden"
            />
            {resumeFile ? resumeFile.name : 'Upload Resume'}
          </label>
        </div>
      )}

      <div className="flex">
        <button
          onClick={onNext}
          disabled={isLoading || !canProceed}
          className="flex-1 p-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300"
        >
          {isLoading ? (
            <PropagateLoader color="#ffffff" size={10} className="p-3" />
          ) : (
            hasExistingResume ? 'Continue' : 'Complete Setup'
          )}
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}
      {!canProceed && !error && <p className="text-amber-500 text-sm mt-2">{getHelperText()}</p>}
    </div>
  );
};

export default SecondStep;