import React, { useState } from "react";
import Advocate from "../components/Adovcate";

interface Advocate {
  id: number;
  name: string;
  title: string;
  company: string;
  initials: string; 
  linkedin?: string | undefined;
}


const advocates = [
  {
    id: 1,
    name: "Elon Jobs",
    title: "Founder & CEO",
    company: "Decagon",
    initials: "EJ",
    linkedin: "https://www.linkedin.com/in/elon-jobs/"
  },
  {
    id: 1,
    name: "David Mai",
    title: "Director of Product",
    company: "Decagon",
    initials: "DM",
    linkedin: "https://www.linkedin.com/in/elon-jobs/"
  },
  {
    id: 1,
    name: "Sean Joe",
    title: "Product Manager",
    company: "Decagon",
    initials: "SJ"
  }
];

const ContentApp: React.FC = () => {
  const [selectedAdvocate, setSelectedAdvocate] = useState<Advocate | null>(null);

  const handleCompose = (advocate: Advocate) => {
    setSelectedAdvocate(advocate);
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
    } catch (error) {
      console.error("Error sending email:", error);
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
        {advocates.map((advocate) => (
          selectedAdvocate === null || selectedAdvocate === advocate ? (
            <Advocate
              key={advocate.initials}
              name={advocate.name}
              title={advocate.title}
              company={advocate.company}
              initials={advocate.initials}
              isSelected={selectedAdvocate === advocate}
              linkedin={advocate.linkedin}
              onCompose={() => handleCompose(advocate)}
              onSendEmail={handleSendEmail}
            />
          ) : null
        ))}
      </div>
    </div>
  );
};

export default ContentApp;