import React, { useState } from 'react';
import { PropagateLoader } from 'react-spinners';

interface Employee {
  first_name: string;
  last_name: string;
  position: string;
  seniority: string;
  email: string;
  linkedin_url?: string;
}

interface ConfirmationDialogProps {
  onClose: () => void;
  onEmployeesFound: (employees: Employee[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ onClose, onEmployeesFound, isLoading, setIsLoading }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(true);
  const [hasUserResponded, setHasUserResponded] = useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const jobInfo = await chrome.tabs.sendMessage(tab.id!, { action: 'GET_JOB_INFO' });
      
      if (!jobInfo.isJobSite) {
        throw new Error('This page does not appear to be a job posting');
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/hunter/search?domain=${jobInfo.domain}&jobTitle=${jobInfo.jobTitle}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch employees');
      
      const data = await response.json();
      setEmployees(data);
      onEmployeesFound(data);
    } catch (error) {
      setError('Failed to fetch employee information');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponse = async (wantsToContact: boolean) => {
    setShowConfirmation(false);
    setHasUserResponded(true);
    
    if (wantsToContact) {
      await fetchEmployees();
    } else {
      onClose();
    }
  };

  if (showConfirmation) {
    return (
      <div className="p-4 flex flex-col items-center">
        <h2 className="text-xl font-bold mb-6 text-center">
          Do you want to contact potential advocates at this company?
        </h2>
        <div className="flex gap-4">
          <button
            onClick={() => handleResponse(true)}
            className="px-8 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Yes
          </button>
          <button
            onClick={() => handleResponse(false)}
            className="px-8 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            No
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {isLoading && (
        <div className="text-center py-4">
          <PropagateLoader color="#000000" size={10} className="p-3" />
          <p>Finding potential advocates...</p>
        </div>
      )}
      
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      <div className="space-y-4">
        {employees.map((employee, index) => (
          <div key={index} className="border p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">
                {employee.first_name} {employee.last_name}
              </h3>
              <span className="text-sm text-gray-500 px-2 py-1 bg-gray-100 rounded">
                {employee.seniority}
              </span>
            </div>
            
            <p className="text-gray-700 mb-2">{employee.position}</p>
            
            <div className="flex items-center gap-4 mt-3">
              <a 
                href={`mailto:${employee.email}`}
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {employee.email}
              </a>
              
              {employee.linkedin_url && (
                <a 
                  href={employee.linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  LinkedIn Profile
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {employees.length === 0 && !isLoading && !error && hasUserResponded && (
        <p className="text-gray-500 text-center mt-4">
          No potential advocates found at this company
        </p>
      )}
    </div>
  );
};

export default ConfirmationDialog;