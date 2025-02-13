import React from 'react';
import { FaLinkedin } from "react-icons/fa";

interface AdvocateProps {
  name: string;
  title: string;
  company: string;
  initials: string;
  linkedin?: string;
}

const Advocate: React.FC<AdvocateProps> = ({ name, title, company, initials, linkedin }) => {
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
      <div className="flex">
        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Compose Email
        </button>
      </div>
    </div>
  );
};

export default Advocate;
