import React, { useState } from "react";
import Advocate from "../components/Advocate";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { Employee } from "../types/Employee";
import { GmailService } from '../services/gmailService';
import { useUser } from '../context/UserProvder';

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
  const [advocates, setAdvocates] = useState<Employee[]>([]);
  const [selectedAdvocate, setSelectedAdvocate] = useState<Employee | null>(null);
  const [emailedAdvocates, setEmailedAdvocates] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [AIEmail, setAIEmail] = useState<{ subject: string; body: string } | null>(null);
  const [_error, setError] = useState<string | Error | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(true);
  const [jobInfo, setJobInfo] = useState<{
    companyBackground: string;
    jobRequirements: string;
    companyName: string;
  }>({
    companyBackground: "",
    jobRequirements: "",
    companyName: ""
  });

  const { contextResume, user } = useUser();

  const fetchJobInfoAndEmployees = async () => {
    setIsLoading(true);
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active tab found');

      // Get job info from content script
      const jobInfo = await chrome.tabs.sendMessage(tab.id, { action: 'GET_JOB_INFO' });
      console.log('Job info received:', jobInfo);

      if (!jobInfo.isJobSite) {
        throw new Error('This page does not appear to be a job posting');
      }

      // Set job info with all expected fields
      setJobInfo({
        companyBackground: jobInfo.companyBackground || "",
        jobRequirements: jobInfo.jobRequirements || "",
        companyName: jobInfo.companyName || ""
      });

      // Fetch employees
      const apiUrl = `${import.meta.env.VITE_BACKEND_URL}/snov/search?domain=${encodeURIComponent(jobInfo.domain)}&jobTitle=${encodeURIComponent(jobInfo.jobTitle || "")}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const employees = await response.json();
      setAdvocates(employees);
      setShowConfirmation(false);

    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompose = async (advocate: Employee) => {
    setSelectedAdvocate(advocate);
    setIsLoadingEmail(true);

    console.log('jobInfo', jobInfo);

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
    setSelectedAdvocate(null);
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
      await gmailService.sendEmail(
        `${selectedAdvocate.first_name} <${selectedAdvocate.email || 'advocate@example.com'}>`,
        subject,
        content,
        "Ekene"
      );

      setEmailedAdvocates(prev => [...new Set([...prev, parseInt(selectedAdvocate.id)])]);
      console.log("Email sent successfully");
      setIsLoading(false);
      setSelectedAdvocate(null);
      
    } catch (error) {
      console.error("Error sending email:", error);
      setError("There was an error sending the email. Please try again.");
      setIsLoading(false);
    }
    
  };

  if (showConfirmation) {
    return (
      <div className="p-4 max-w-md">
        <ConfirmationDialog
          onClose={() => setShowConfirmation(false)}
          onConfirm={fetchJobInfoAndEmployees}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Advocates</h1>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex flex-col gap-14">
      {advocates.map((employee) => {
          if (emailedAdvocates.includes(parseInt(employee.id))) {
            return (
              <div key={employee.id} className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-600 font-medium">
                  Email sent successfully to {employee.first_name + " " + employee.last_name} ✓
                </p>
                <p className="text-gray-600 mt-2 text-sm">
                  We suggest waiting at least three days before continuing your outreach and follow ups.
                </p>
              </div>
            );
          }

          return selectedAdvocate === null || selectedAdvocate === employee ? (
            <Advocate
              key={employee.id}
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
          ) : null;
        })}
      </div>
    </div>
  );
};

export default ContentApp;