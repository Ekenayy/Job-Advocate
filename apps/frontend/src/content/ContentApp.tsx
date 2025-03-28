import React, { useState, useEffect } from "react";
import Advocate from "../components/Advocate";
import ConfirmationDialog from "../components/ConfirmationDialog";
import DomainInputDialog from "../components/DomainInputDialog";
import { Employee } from "../types/Employee";
import { GmailService } from '../services/gmailService';
import { useUser } from '../context/UserProvder';
import { ErrorWithDetails } from "../types/Error";
import { FaSearchengin } from "react-icons/fa6";
import { createEmail } from "../server/Email";

interface Advocate {
  id: number;
  name: string;
  title: string;
  company: string;
  email: string;
  initials: string; 
  linkedin?: string | undefined;
}

// Helper function to format error messages
const formatErrorMessage = (error: string | Error | null): string => {
  if (error === null) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  return 'An error occurred';
};

const ContentApp: React.FC = () => {
  const { contextResume, user, lastAdvocates, setLastContextAdvocates, userEmails, setContextUserEmails, jobInfo, updateJobInfo } = useUser();

  const [advocates, setAdvocates] = useState<Employee[]>([]);
  const [selectedAdvocate, setSelectedAdvocate] = useState<Employee | null>(null);
  const [emailedAdvocates, setEmailedAdvocates] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [AIEmail, setAIEmail] = useState<{ subject: string; body: string } | null>(null);
  const [error, setError] = useState<string | Error | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(!lastAdvocates.length);
  const [isJobListingPage, setIsJobListingPage] = useState(false);
  const [showDomainInput, setShowDomainInput] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    if (lastAdvocates.length > 0) {
      setAdvocates(lastAdvocates);
    }
  }, [lastAdvocates]);

  // Helper function to get the correct content script path
  const getContentScriptPath = () => {
    // In production, we need to find the content script in the assets directory
    // This will match any file that starts with "content.tsx" in the assets directory
    return { 
      func: () => {
        // This function runs in the context of the web page
        // It will notify the extension that it needs to inject the content script
        chrome.runtime.sendMessage({ 
          action: "INJECT_CONTENT_SCRIPT" 
        });
      }
    };
  };

  const fetchJobInfoAndEmployees = async () => {
    setIsLoading(true);
    setError(null); // Clear previous errors
    setIsJobListingPage(false); // Reset job listing page flag
    setShowDomainInput(false); // Hide domain input if it was shown
    setErrorCode(null); // Reset error code
    
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active tab found');

      // Get job info from content script
      let jobInfoResponse;
       try {
         jobInfoResponse = await chrome.tabs.sendMessage(tab.id, 
          { action: 'GET_JOB_INFO',
            user_id: user?.externalId
          });
       } catch (msgError) {
         console.error('Error sending message to content script:', msgError);
         // If we can't communicate with the content script, try to inject it
         try {
           const contentScriptPath = getContentScriptPath();
           
           // Use the function approach to notify the background script
           await chrome.scripting.executeScript({
             target: { tabId: tab.id },
             func: contentScriptPath.func
           });
           
           // Wait a moment for the background script to handle the injection
           await new Promise(resolve => setTimeout(resolve, 1000));
           
           // Try again after injecting the content script
           jobInfoResponse = await chrome.tabs.sendMessage(tab.id, 
            { action: 'GET_JOB_INFO',
              user_id: user?.externalId
            });
         } catch (injectionError) {
           console.error('Error injecting content script:', injectionError);
           throw new Error('Unable to communicate with the page. Please refresh the page and try again.');
         }
       }

      // Check if we're on a job listing page - do this check FIRST before any other processing
      if (jobInfoResponse.isJobListingPage) {
        setIsJobListingPage(true);
        setIsLoading(false); // Stop loading immediately
        return; // Exit early without making backend calls
      }

      if (!jobInfoResponse.isJobSite) {
        throw new Error('This page does not appear to be a job posting');
      }

      // Update job info with all expected fields in the context
      await updateJobInfo({
        companyBackground: jobInfoResponse.companyBackground || "",
        jobRequirements: jobInfoResponse.jobRequirements || "",
        companyName: jobInfoResponse.companyName || "",
        potentialAdvocates: jobInfoResponse.potentialAdvocates || [],
        domain: jobInfoResponse.domain || "",
        jobTitle: jobInfoResponse.jobTitle || ""
      });

      // Call searchEmployees with the detected domain
      await searchEmployees(
        jobInfoResponse.domain, 
        jobInfoResponse.jobTitle || "", 
        jobInfoResponse.potentialAdvocates || []
      );

    } catch (error) {
      console.error('Error in fetchJobInfoAndEmployees:', error);

      if (error instanceof ErrorWithDetails) {
        setErrorCode(error.code);

        
        if (error.code === "NO_VALID_EMPLOYEES" && jobInfo) {
          console.log('Showing domain input dialog for NO_VALID_EMPLOYEES error');
          setShowDomainInput(true);
          setError(error.details);
        } else if (error.code === "NO_EMPLOYEES_FOUND") {
          console.log('Handling NO_EMPLOYEES_FOUND error');
          setError(error.details);
        } else if (error.code === "MISSING_PARAMETERS") {
          console.log('Handling MISSING_PARAMETERS error');
          setError("There was an error fetching employees. Please make sure you are on a job page.");
        } else {  
          console.log('Handling other error with code:', error.code);
          setError(error.details);
        }
      } else {
        console.log('Handling generic error');
        setError(new ErrorWithDetails(
          error instanceof Error ? error.message : 'An error occurred',
          'We encountered an unexpected error. Try the search again or make sure you are on a job posting page.',
          ['Try refreshing the page', 'Make sure you\'re on a job posting page'],
          'UNKNOWN_ERROR'
        ));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // New function to search employees with a specific domain
  const searchEmployees = async (domain: string, jobTitle: string, potentialAdvocates: string[]) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/snov/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domain,
          jobTitle,
          potentialAdvocates
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();

        // Create an ErrorWithDetails object with the error data
        const errorWithDetails = new ErrorWithDetails(
          errorData.error || 'Failed to fetch employees',
          errorData.details || 'Unknown error details',
          errorData.suggestions || [],
          errorData.code || 'UNKNOWN_ERROR'
        );
        
        throw errorWithDetails;
      }

      const employees = await response.json();
      setAdvocates(employees);
      setLastContextAdvocates(employees);
      setShowConfirmation(false);
      return employees;
    } catch (error) {
      console.error('Error in searchEmployees:', error);
      throw error;
    }
  };

  // Handler for domain input submission
  const handleDomainSubmit = async (domain: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!jobInfo || !jobInfo.jobTitle) {
        throw new Error('No job information available');
      }
      
      // Update the job info in context with the new domain using updateJobInfo
      await updateJobInfo({ domain });
      
      // Search with the new domain
      await searchEmployees(domain, jobInfo.jobTitle, jobInfo.potentialAdvocates || []);
      
      // Hide the domain input dialog on success
      setShowDomainInput(false);
    } catch (error) {
      console.error('Error with custom domain:', error);
      if (error instanceof ErrorWithDetails) {
        setError(error.details);
      } else {
        setError(error instanceof Error ? error.message : 'Failed to search with the provided domain');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompose = async (advocate: Employee) => {
    setSelectedAdvocate(advocate);
    setIsLoadingEmail(true);

    try {
      // Check if we have the necessary job info
      if (!jobInfo) {
        throw new Error('No job information available');
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/email/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userName: user?.firstName,
          advocateName: advocate.first_name + " " + advocate.last_name,
          companyBackground: jobInfo.companyBackground,
          personBackground: typeof contextResume?.parsed_data.Summary === 'string' 
            ? { summary: contextResume?.parsed_data.Summary } 
            : contextResume?.parsed_data.Summary || {},
          myQualifications: {
            skills: contextResume?.parsed_data.Skills || [],
            experience: contextResume?.parsed_data.Experience || [],
            education: contextResume?.parsed_data.Education || []
          },
          jobRequirements: jobInfo.jobRequirements
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to generate email');
      }
  
      const data = await response.json();
      setAIEmail(data);
    } catch (error) {
      console.error('Error generating email:', error);
      throw error;
    } finally {
      setIsLoadingEmail(false);
    }
    
  };

  const handleClose = () => {
    if (selectedAdvocate) {
      setSelectedAdvocate(null);
    } else {
      setShowDomainInput(false);
      setShowConfirmation(true);
    }
  };

  const handleSendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const subject = formData.get('subject') as string;
    const content = formData.get('content') as string;

    if (!selectedAdvocate) {
      console.error("No advocate selected");
      return;
    }

    setIsLoading(true);

    try {
      const gmailService = GmailService.getInstance();
      const response = await gmailService.sendEmail(
        `${selectedAdvocate.first_name} <${import.meta.env.VITE_ENVIRONMENT === 'development' ? 'ekene@joifulhealth.io' : selectedAdvocate.email}>`,
        subject,
        content,
        user?.firstName || ""
      );
      
      if (response.status === 'success') {
        setEmailedAdvocates([...emailedAdvocates, selectedAdvocate]);
        const databaseEmail = await createEmail(user?.externalId || "", selectedAdvocate.email, subject, content);
        setContextUserEmails([...userEmails, databaseEmail]);
      } else {
        setError("There was an error sending the email. Please try again.");
      }

      setIsLoading(false);
      setSelectedAdvocate(null);
      
    } catch (error) {
      console.error("Error sending email:", error);
      setError("There was an error sending the email. Please try again.");
      setIsLoading(false);
    }
    
  };

  const handleDomainInputCancel = () => {
    setShowDomainInput(false);
    setShowConfirmation(true);
    setError(null);
  }


  if (showConfirmation && !isJobListingPage && !showDomainInput) {
    return (
      <div className="p-4">
        <ConfirmationDialog
          onClose={() => setShowConfirmation(false)}
          onConfirm={fetchJobInfoAndEmployees}
          isLoading={isLoading}
        />
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-400 rounded-md">
            <p className="text-red-700 font-medium">
              {formatErrorMessage(error)}
            </p>
            {error instanceof ErrorWithDetails && error.details && (
              <p className="text-red-600 mt-2">
                {error.details}
              </p>
            )}
            {error instanceof ErrorWithDetails && error.suggestions && error.suggestions.length > 0 && (
              <ul className="mt-2 list-disc list-inside text-red-600">
                {error.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            )}
          </div>
        )}  
      </div>
    );
  }

  // Show domain input dialog when needed
  if (showDomainInput && jobInfo) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">InReach</h1>
          <button onClick={() => setShowConfirmation(true)} className="cursor-pointer text-gray-400 hover:text-gray-600">
            <FaSearchengin className="w-5 h-5" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-md">
            <p className="text-amber-800 font-medium">
              {formatErrorMessage(error)}
            </p>
          </div>
        )}
        
        <DomainInputDialog
          companyName={jobInfo.companyName}
          guessedDomain={jobInfo.domain || ""}
          onSubmit={handleDomainSubmit}
          onCancel={handleDomainInputCancel}
          isLoading={isLoading}
        />
      </div>
    );
  }

  // Special UI for job listing pages
  if (isJobListingPage) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">InReach</h1>
          <button onClick={handleClose} className="text-gray-400 cursor-pointer transition-colors duration-300 hover:text-blue-600">
            <FaSearchengin className="w-5 h-5" />
          </button>
        </div>
        
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4">
          <div className="flex items-center mb-3">
            <svg className="w-6 h-6 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <h2 className="text-amber-800 font-medium text-lg">
              This appears to be a job listing page
            </h2>
          </div>
          
          <p className="text-amber-700 mb-4">
            InReach works best with individual job postings, not search results or job listing pages.
          </p>
          
          <div className="bg-white rounded-lg p-4 border border-amber-200 mb-4">
            <h3 className="font-medium text-gray-800 mb-3">How to find individual job postings on sites like Glassdoor and Indeed:</h3>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li className="pb-2">
                <span className="font-medium">Click on a job title</span> from the list of search results
                <img src="https://i.imgur.com/example1.png" alt="Click on job title" className="hidden" />
              </li>
              <li className="pb-2">
                <span className="font-medium">Wait for the full job details</span> to load on the right side or in a new page
              </li>
              <li>
                <span className="font-medium">Look for the "Apply" button</span> to confirm you're viewing a complete job posting
              </li>
            </ol>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
            <p className="text-blue-800 text-sm">
              <strong>Tip:</strong> On job listing pages, you may need to click a job title, then wait to be redirected to a new page with the full job details. 
            </p>
          </div>
          
          <button 
            onClick={fetchJobInfoAndEmployees} 
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Try Again After Selecting a Job
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Advocates</h1>
        <button onClick={handleClose} className="text-gray-400 cursor-pointer hover:text-blue-600">
          {selectedAdvocate ? <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg> : <FaSearchengin className="w-5 h-5" />}
        </button>
      </div>
      
      {error && errorCode !== "NO_VALID_EMPLOYEES" && (
        <div className="mb-4 p-4 bg-red-50 border border-red-400 rounded-md">
          <p className="text-red-700 font-medium">
            {formatErrorMessage(error)}
          </p>
        </div>
      )}
      
      <div className="flex flex-col gap-14">
      { advocates.length > 0 ? advocates.map((employee) => {
          return (
            <div key={employee.id}>
              {emailedAdvocates.some(advocate => advocate.email === employee.email) ? (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-600 font-medium">
                    Email sent successfully to {employee.first_name + " " + employee.last_name} ✓
                  </p>
                  <p className="text-gray-600 mt-2 text-sm">
                    We suggest waiting at least three days before continuing your outreach and follow ups.
                  </p>
                </div>
              ) : (
                (selectedAdvocate === null || selectedAdvocate === employee) && (
                  <Advocate
                    employee={employee}
                    isSelected={selectedAdvocate === employee}
                    isLoading={isLoading}
                    isLoadingEmail={isLoadingEmail}
                    onCompose={() => handleCompose(employee)}
                    onSendEmail={handleSendEmail}
                    AIEmail={AIEmail}
                  />
                )
              )}
            </div>
          );
        }) : (
          <div className="text-center text-gray-500">
            No advocates found for this job.
          </div>
        )}
      </div>
    </div>
  );
};

// Custom error class to handle structured error responses


export default ContentApp;