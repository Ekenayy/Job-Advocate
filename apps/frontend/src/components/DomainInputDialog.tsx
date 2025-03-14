import React, { useState } from 'react';

interface DomainInputDialogProps {
  companyName: string;
  onSubmit: (domain: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const DomainInputDialog: React.FC<DomainInputDialogProps> = ({
  companyName,
  onSubmit,
  onCancel,
  isLoading
}) => {
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');

  // Function to extract domain from URL
  const extractDomain = (input: string): string => {
    try {
      // Remove any whitespace
      const trimmedInput = input.trim();
      
      // If it's already a valid domain, return it
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
      if (domainRegex.test(trimmedInput)) {
        return trimmedInput;
      }

      // Try to parse as URL
      let url: URL;
      try {
        // Add protocol if missing to make URL parsing work
        const urlString = trimmedInput.startsWith('http') ? trimmedInput : `https://${trimmedInput}`;
        url = new URL(urlString);
      } catch {
        throw new Error('Invalid URL or domain format');
      }

      // Get the hostname and remove 'www.' if present
      return url.hostname.replace(/^www\./, '');
    } catch (error) {
      throw new Error('Invalid URL or domain format');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!domain) {
      setError('Please enter a domain');
      return;
    }
    
    try {
      // Extract and validate the domain
      const extractedDomain = extractDomain(domain);
      onSubmit(extractedDomain);
    } catch (error) {
      setError('Please enter a valid domain (e.g., company.com)');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setDomain(input);
    setError('');

    // Try to extract domain as user types
    try {
      const extractedDomain = extractDomain(input);
      if (extractedDomain !== input) {
        setDomain(extractedDomain);
      }
    } catch {
      // Ignore errors during typing
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-md">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Enter Company Domain
      </h2>
      
      <p className="text-gray-600 mb-4">
        We couldn't automatically determine the correct domain for <strong>{companyName}</strong>. 
        Please enter the company's domain to continue.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
            Company Domain
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              id="domain"
              className={`block w-full pr-10 focus:outline-none sm:text-sm rounded-md p-2 border ${
                error ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="company.com or https://company.com"
              value={domain}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600" id="domain-error">
              {error}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            You can paste the full URL or just the domain (e.g., "company.com" or "https://company.com")
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </>
            ) : (
              'Search with this Domain'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DomainInputDialog; 