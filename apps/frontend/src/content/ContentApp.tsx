import React from "react";
import Advocate from "../components/Adovcate";

const advocates = [
  {
    name: "Elon Jobs",
    title: "Founder & CEO",
    company: "Decagon",
    initials: "EJ",
    linkedin: "https://www.linkedin.com/in/elon-jobs/"
  },
  {
    name: "David Mai",
    title: "Director of Product",
    company: "Decagon",
    initials: "DM",
    linkedin: "https://www.linkedin.com/in/elon-jobs/"
  },
  {
    name: "Sean Joe",
    title: "Product Manager",
    company: "Decagon",
    initials: "SJ"
  }
];

const ContentApp: React.FC = () => {
  return (
    <div className="p-4 max-w-md">
      <div className="flex items-center border-b border-gray-200 pb-3 justify-between mb-4">
        <h1 className="text-2xl font-semibold">Advocates</h1>
        <button className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex flex-col gap-14">
        {advocates.map((advocate) => (
          <Advocate
            key={advocate.initials}
            name={advocate.name}
            title={advocate.title}
            company={advocate.company}
            initials={advocate.initials}
            linkedin={advocate.linkedin}
          />
        ))}
      </div>
    </div>
  );
};

export default ContentApp;