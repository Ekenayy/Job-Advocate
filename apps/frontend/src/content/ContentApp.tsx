import React, { useState } from "react";
import Advocate from "../components/Advocate";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { Onboarding } from "../components/onboarding/Onboarding";

interface Employee {
  first_name: string;
  last_name: string;
  position: string;
  seniority: string;
  email: string;
  linkedin_url?: string;
  id: string;
}

const ContentApp: React.FC = () => {
  const [selectedAdvocate, setSelectedAdvocate] = useState<Employee | null>(null);
  const [advocates, setAdvocates] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [AIEmail, setAIEmail] = useState<{ subject: string; body: string } | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(true);

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
          companyBackground: testBackground.companyBackground,
          personBackground: testBackground.personBackground,
          myQualifications: testBackground.myQualifications,
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

    const formBody = {
      user_id: "86318221-2f8e-43e2-822c-2d76e94b7aad",
      advocate_id: selectedAdvocate.id,
      subject: subject,
      email_body: content, 
      to_email: "ekenayy@gmail.com",
      status:"pending"
    };
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/email`, {
        method: 'POST',
        body: JSON.stringify(formBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      console.log("Email sent successfully");
      const data = await response.json();
      console.log('response data:', data);
      setIsLoading(false);
      setSelectedAdvocate(null);
    } catch (error) {
      console.error("Error sending email:", error);
      setIsLoading(false);
    } 
  };

  if (!isOnboardingComplete) {
    return (
      <div className="p-4 max-w-md">
        <Onboarding setIsOnboardingComplete={setIsOnboardingComplete} />
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="p-4 max-w-md">
        <ConfirmationDialog
          onClose={() => setShowConfirmation(false)}
          onEmployeesFound={handleEmployeesFound}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
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
        {advocates.map((employee) => (
          selectedAdvocate === null || selectedAdvocate === employee ? (
            <Advocate
              key={`${employee.first_name}-${employee.last_name}`}
              name={`${employee.first_name} ${employee.last_name}`}
              title={employee.position}
              company={employee.seniority}
              initials={`${employee.first_name[0]}${employee.last_name[0]}`}
              isSelected={selectedAdvocate === employee}
              isLoading={isLoading}
              linkedin={employee.linkedin_url}
              onCompose={() => handleCompose(employee)}
              onSendEmail={handleSendEmail}
              AIEmail={AIEmail}
              isLoadingEmail={isLoadingEmail}
            />
          ) : null
        ))}
      </div>
    </div>
  );
};

export default ContentApp;