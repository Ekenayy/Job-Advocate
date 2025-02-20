import React, { useState, useEffect } from "react";
import Advocate from "../components/Advocate";
import { Onboarding } from "../components/onboarding/Onboarding";
import { GmailService } from '../services/gmailService';

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
  "companyBackground": "Google is a global leader in technology and innovation, renowned for its transformative search engine, advertising platforms, and extensive suite of products and services. The company is committed to organizing the world's information and making it universally accessible and useful, while pushing the boundaries in areas like artificial intelligence, cloud computing, and quantum research. Google's culture of innovation, openness, and continuous learning empowers its teams to tackle some of the world's most challenging problems.",
  "personBackground": "I am an experienced product manager with a strong passion for technology and user-centered design. Over the years, I have successfully led cross-functional teams to launch and scale innovative products in fast-paced environments. My background combines a deep understanding of market dynamics with technical acumen, enabling me to bridge the gap between business strategy and engineering execution.",
  "myQualifications": "With over 8 years of product management experience, I have honed my skills in market research, agile development, and data-driven decision-making. I have a proven track record of managing the full product lifecycle, from ideation to launch and iteration. My ability to collaborate effectively with engineering, design, and marketing teams has resulted in the successful delivery of high-impact products. Additionally, my analytical mindset and strategic vision have been key in driving product innovation and growth.",
  "jobRequirements": "The ideal candidate for the Product Manager role at Google should be a visionary leader with a strong grasp of technology trends and a passion for creating user-centric products. Key requirements include exceptional communication skills, experience in agile methodologies, and a demonstrated ability to translate complex problems into actionable product strategies. The role demands proficiency in data analysis, stakeholder management, and the ability to thrive in a dynamic, fast-paced environment while fostering cross-functional collaboration."
}


const ContentApp: React.FC = () => {
  const [selectedAdvocate, setSelectedAdvocate] = useState<Advocate | null>(null);
  const [emailedAdvocates, setEmailedAdvocates] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [AIEmail, setAIEmail] = useState<{ subject: string; body: string } | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [error, setError] = useState<string | Error | null>(null);

  useEffect(() => {
    if (chrome.storage) {
      chrome.storage.local.get('isOnboardingComplete', (result) => {
        setIsOnboardingComplete(result.isOnboardingComplete || false);
      });
    }
  }, []);

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

    // const formBody = {
    //   user_id: "86318221-2f8e-43e2-822c-2d76e94b7aad",
    //   advocate_id: selectedAdvocate.id,
    //   subject: subject,
    //   email_body: content, 
    //   to_email: "ekenayy@gmail.com",
    //   status:"pending"
    // };

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
      
      // Optional: Show success message to user
      // You can add a toast or notification here
    } catch (error) {
      console.error("Error sending email:", error);
      setError("There was an error sending the email. Please try again.");
      setIsLoading(false);
      // Optional: Show error message to user
      // You can add a toast or notification here
    }
    
    // try {
    //   const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/email`, {
    //     method: 'POST',
    //     body: JSON.stringify(formBody),
    //     headers: {
    //       'Content-Type': 'application/json'
    //     }
    //   });

    //   if (!response.ok) {
    //     throw new Error("Failed to send email");
    //   }

    //   console.log("Email sent successfully");
    //   const data = await response.json();
    //   console.log('response data:', data);
    //   setIsLoading(false);
    //   setSelectedAdvocate(null);
    // } catch (error) {
    //   console.error("Error sending email:", error);
    //   setIsLoading(false);
    // } 
  };

  if (!isOnboardingComplete) {
    return (
      <div className="p-4">
        <Onboarding setIsOnboardingComplete={setIsOnboardingComplete} />
      </div>
    )
  }

  console.log('emailedAdvocates:', emailedAdvocates);

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