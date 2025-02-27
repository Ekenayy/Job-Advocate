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

const testBackground = 	{
  "companyBackground": "Soda Health is a healthcare technology company focused on building solutions which eliminate health inequities and create a healthier America.  We provide a technology platform to administer benefits personalized to individual needs, delivered more cost-effectively.  Our expertise in healthcare, retail and consumer experience provides us with the foundation for creating easy-to-use solutions with an experience which moves beyond transactional relationships to sustained engagement and overall health improvement.  That is a win for everyone. Soda Health is a Series B stage company, backed by leading investors including Define Ventures, General Catalyst, Lightspeed Venture Partners, Pinegrove Capital Partners, and Qiming Venture Partners.",
  "jobRequirements": `While every candidate brings a unique resume and prospective, an ideal candidate will include: 5-15 years software engineering experience
Refined ability to present and demo your work so others can understand it
Robust experience working in a full-stack environment where the backend is strongly typed (we use golang)
Experience in browser tech (HTML, CSS, JavaScript)
Desire to build end-to-end, from business logic to presentation (we use HTMX/templ)
Comfort with container technology (Docker or similar)
Heads-up awareness of production applications with effective monitoring, logging, and observability of the full application stack.
Confidence and ability to provide supportive and critical feedback in PR reviews to make the code better for everyone
Enthusiasm for writing efficient tests that produce tight feedback loops
Passion to take ownership, collaborate, and solve problems for real, everyday people
Technical and cultural leader who encourages these traits in the people around them
Bachelor’s degree or similar experience strongly preferred`
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
          advocateName: advocate.first_name + " " + advocate.last_name,
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
              title={employee.title}
              company={employee.company}
              initials={employee.first_name.charAt(0) + employee.last_name.charAt(0)}
              isSelected={selectedAdvocate === employee}
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