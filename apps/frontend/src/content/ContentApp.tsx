import React, { useState } from "react";
import Advocate from "../components/Advocate";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { Employee } from "../types";
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

const advocates = [
  {
    id: 1,
    name: "Elon Jobs",
    title: "Founder & CEO",
    company: "Decagon",
    email: "ekene@joifulhealth.io",
    initials: "EJ",
    linkedin: "https://www.linkedin.com/in/elon-jobs/"
  },
  {
    id: 2,
    name: "David Mai",
    title: "Director of Product",
    company: "Decagon",
    email: "ekene@joifulhealth.io",
    initials: "DM",
    linkedin: "https://www.linkedin.com/in/elon-jobs/"
  },
  {
    id: 3,
    name: "Sean Joe",
    title: "Product Manager",
    company: "Decagon",
    email: "ekene@joifulhealth.io",
    initials: "SJ"
  }
];


const ContentApp: React.FC = () => {
  const [selectedAdvocate, setSelectedAdvocate] = useState<Advocate | null>(null);
  const [emailedAdvocates, setEmailedAdvocates] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [AIEmail, setAIEmail] = useState<{ subject: string; body: string } | null>(null);
  const [_error, setError] = useState<string | Error | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(true);

  const { contextResume } = useUser();

  const handleEmployeesFound = (employees: Employee[]) => {
    setAdvocates(employees);
    setShowConfirmation(false);
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
          userName: "Kevlin",
          advocateName: advocate.name,
          companyBackground: testBackground.companyBackground,
          personBackground: typeof contextResume?.parsed_data.Summary === 'string' 
            ? { summary: contextResume?.parsed_data.Summary } 
            : contextResume?.parsed_data.Summary || {},
          myQualifications: {
            skills: contextResume?.parsed_data.Skills || [],
            experience: contextResume?.parsed_data.Experience || [],
            education: contextResume?.parsed_data.Education || []
          },
          jobRequirements: testBackground.jobRequirements
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
        `${selectedAdvocate.name} <${selectedAdvocate.email || 'advocate@example.com'}>`,
        subject,
        content,
        "Ekene"
      );

      setEmailedAdvocates(prev => [...new Set([...prev, selectedAdvocate.id])]);
      console.log("Email sent successfully");
      setIsLoading(false);
      setSelectedAdvocate(null);
      
    } catch (error) {
      console.error("Error sending email:", error);
      setError("There was an error sending the email. Please try again.");
      setIsLoading(false);
    }
    
  };


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
      {advocates.map((advocate) => {
          if (emailedAdvocates.includes(advocate.id)) {
            return (
              <div key={advocate.id} className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-600 font-medium">
                  Email sent successfully to {advocate.name} ✓
                </p>
                <p className="text-gray-600 mt-2 text-sm">
                  We suggest waiting at least three days before continuing your outreach and follow ups.
                </p>
              </div>
            );
          }

          return selectedAdvocate === null || selectedAdvocate === advocate ? (
            <Advocate
              key={advocate.id}
              name={advocate.name}
              title={advocate.title}
              company={advocate.company}
              initials={advocate.initials}
              isSelected={selectedAdvocate === advocate}
              isLoading={isLoading}
              linkedin={employee.linkedin_url}
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