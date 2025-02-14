import React, { useState } from 'react';
import { FaLinkedin } from "react-icons/fa";
import  TextareaAutosize from 'react-textarea-autosize';

interface AdvocateProps {
  name: string;
  title: string;
  company: string;
  initials: string;
  linkedin?: string;
  isSelected: boolean;
  onCompose: () => void;
  onSendEmail: () => void;
}

const Advocate: React.FC<AdvocateProps> = ({ name, title, company, initials, linkedin, isSelected, onCompose, onSendEmail }) => {
  const [emailContent, setEmailContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  
  return (
    <div className="flex flex-col gap-6 pr-3 bg-gray-100 p-3 rounded-lg">
      <div className={`flex items-center justify-between`}>
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-gray-700">{initials}</span>
        </div>
        <span className="text-2xl font-medium">{name}</span>
        {linkedin ? <a href={linkedin} target="_blank" rel="noopener noreferrer">
          <FaLinkedin className="w-6 h-6 text-blue-600" />
        </a> : <div className="w-6 h-6" />}
      </div>
      <div className="flex text-lg text-black justify-between">
        <span className="font-bold">{company}</span>
        <span>{title}</span>
      </div>
      {isSelected && 
      <form className="flex flex-col gap-6" onSubmit={onSendEmail}>
        <TextareaAutosize
          name="subject"
          value={emailSubject}
          onChange={(e) => setEmailSubject(e.target.value)}
          placeholder="Your Subject here.."
          className="w-full p-2 border rounded-md"
          minRows={1}
        />
        <TextareaAutosize
          name="content"
          value={emailContent}
          onChange={(e) => setEmailContent(e.target.value)}
          placeholder="Write your email here..."
          className="w-full p-2 border rounded-md"
          minRows={15}
        />
        <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Send Email
        </button>
      </form>
      }
      {!isSelected && <div className="flex">
        <button 
          onClick={onCompose}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Compose Email
        </button>
      </div>}
    </div>
  );
};

export default Advocate;
