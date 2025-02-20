import React, { useState, useEffect } from "react";
import Advocate from "../components/Advocate";
import { Onboarding } from "../components/onboarding/Onboarding";
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

const testBackground = 	{
  "companyBackground": "Soda Health is a healthcare technology company focused on building solutions which eliminate health inequities and create a healthier America.  We provide a technology platform to administer benefits personalized to individual needs, delivered more cost-effectively.  Our expertise in healthcare, retail and consumer experience provides us with the foundation for creating easy-to-use solutions with an experience which moves beyond transactional relationships to sustained engagement and overall health improvement.  That is a win for everyone. Soda Health is a Series B stage company, backed by leading investors including Define Ventures, General Catalyst, Lightspeed Venture Partners, Pinegrove Capital Partners, and Qiming Venture Partners.",
  "personBackground": "I am an experienced product manager with a strong passion for technology and user-centered design. Over the years, I have successfully led cross-functional teams to launch and scale innovative products in fast-paced environments. My background combines a deep understanding of market dynamics with technical acumen, enabling me to bridge the gap between business strategy and engineering execution.",
  "myQualifications": "With over 8 years of product management experience, I have honed my skills in market research, agile development, and data-driven decision-making. I have a proven track record of managing the full product lifecycle, from ideation to launch and iteration. My ability to collaborate effectively with engineering, design, and marketing teams has resulted in the successful delivery of high-impact products. Additionally, my analytical mindset and strategic vision have been key in driving product innovation and growth.",
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
  const [selectedAdvocate, setSelectedAdvocate] = useState<Advocate | null>(null);
  const [emailedAdvocates, setEmailedAdvocates] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [AIEmail, setAIEmail] = useState<{ subject: string; body: string } | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [_error, setError] = useState<string | Error | null>(null);

  const { contextResume } = useUser();

  useEffect(() => {
    if (chrome.storage) {
      chrome.storage.local.get('isOnboardingComplete', (result) => {
        setIsOnboardingComplete(result.isOnboardingComplete || false);
      });
    }
  }, []);

  console.log('contextResume:', contextResume);

  const handleCompose = async (advocate: Advocate) => {
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

      console.log('formBody')
  
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

  if (!isOnboardingComplete) {
    return (
      <div className="p-4">
        <Onboarding setIsOnboardingComplete={setIsOnboardingComplete} />
      </div>
    )
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
              linkedin={advocate.linkedin}
              onCompose={() => handleCompose(advocate)}
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