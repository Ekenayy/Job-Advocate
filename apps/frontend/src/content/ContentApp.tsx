import React, { useState, useEffect } from "react";
import Advocate from "../components/Advocate";
import ConfirmationDialog from "../components/ConfirmationDialog";
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

const ContentApp: React.FC = () => {
  const { contextResume, user, lastAdvocates, setLastContextAdvocates, userEmails, setContextUserEmails, jobInfo, setJobInfo } = useUser();

  const [advocates, setAdvocates] = useState<Employee[]>([]);
  const [selectedAdvocate, setSelectedAdvocate] = useState<Employee | null>(null);
  const [emailedAdvocates, setEmailedAdvocates] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [AIEmail, setAIEmail] = useState<{ subject: string; body: string } | null>(null);
  const [error, setError] = useState<string | Error | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(!lastAdvocates.length);
  const [isJobListingPage, setIsJobListingPage] = useState(false);

  useEffect(() => {
    if (lastAdvocates.length > 0) {
      setAdvocates(lastAdvocates);
    }
  }, [lastAdvocates]);

  const fetchJobInfoAndEmployees = async () => {
    setIsLoading(true);
    setError(null); // Clear previous errors
    setIsJobListingPage(false); // Reset job listing page flag
    
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active tab found');

      // Get job info from content script
      console.log('Sending GET_JOB_INFO message to tab:', tab.id);
      const jobInfo = await chrome.tabs.sendMessage(tab.id, { action: 'GET_JOB_INFO' });
      console.log('Job info received:', jobInfo);

      // Check if we're on a job listing page - do this check FIRST before any other processing
      if (jobInfo.isJobListingPage) {
        console.log('Job listing page detected, showing warning UI');
        setIsJobListingPage(true);
        setIsLoading(false); // Stop loading immediately
        return; // Exit early without making backend calls
      }

      if (!jobInfo.isJobSite) {
        throw new Error('This page does not appear to be a job posting');
      }

      // Set job info with all expected fields
      setJobInfo({
        companyBackground: jobInfo.companyBackground || "",
        jobRequirements: jobInfo.jobRequirements || "",
        companyName: jobInfo.companyName || "",
        potentialAdvocates: jobInfo.potentialAdvocates || []
      });

      // Fetch employees using POST with request body
      console.log('Fetching employees from backend...');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/snov/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domain: jobInfo.domain,
          jobTitle: jobInfo.jobTitle || "",
          potentialAdvocates: jobInfo.potentialAdvocates || []
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('errorData response is not OK', errorData);
        setError(errorData.details);
        throw new ErrorWithDetails(
          errorData.error || 'Failed to fetch employees',
          errorData.details,
          errorData.suggestions,
          errorData.code
        );
      }

      const employees = await response.json();
      setAdvocates(employees);
      setLastContextAdvocates(employees);
      setShowConfirmation(false);

    } catch (error) {
      console.error('Error:', error);
      console.log("error instanceof ErrorWithDetails", error instanceof ErrorWithDetails);
      if (error instanceof ErrorWithDetails) {
        console.log("error.code", error.code);
        if (error.code == "MISSING_PARAMETERS") {
          console.log("setting error to MISSING_PARAMETERS");
          setError("There was an error fetching employees. Please make sure you are on a job page.");
        } else {  
          setError(error.details);
        }
      } else {
        setError(new ErrorWithDetails(
          error instanceof Error ? error.message : 'An error occurred',
          'We encountered an unexpected error',
          ['Try refreshing the page', 'Make sure you\'re on a job posting page'],
          'UNKNOWN_ERROR'
        ));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompose = async (advocate: Employee) => {
    setSelectedAdvocate(advocate);
    setIsLoadingEmail(true);

    try {
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
      console.log('response data:', data);
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
        console.log("Email sent successfully");
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

  console.log("isJobListingPage", isJobListingPage);


  if (showConfirmation && !isJobListingPage) {
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
              {error instanceof Error ? error.message : error}
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
  // Special UI for job listing pages
  if (isJobListingPage) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Job Advocate</h1>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
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
            Job Advocate works best with individual job postings, not search results or job listing pages.
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
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
          {selectedAdvocate ? <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg> : <FaSearchengin className="w-5 h-5" />}
        </button>
      </div>
      <div className="flex flex-col gap-14">
      { advocates.length > 0 ? advocates.map((employee) => {
          return (
            <React.Fragment key={employee.id}>
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
                    name={employee.first_name + " " + employee.last_name}
                    title={employee.position}
                    company={jobInfo.companyName}
                    initials={employee.first_name.charAt(0) + employee.last_name.charAt(0)}
                    email={employee.email}
                    isSelected={selectedAdvocate === employee}
                    isLoading={isLoading}
                    linkedin={employee.source_page}
                    onCompose={() => handleCompose(employee)}
                    onSendEmail={handleSendEmail}
                    AIEmail={AIEmail}
                    isLoadingEmail={isLoadingEmail}
                  />
                )
              )}
            </React.Fragment>
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