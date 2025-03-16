import React, { useEffect, useState } from 'react';

interface ConfirmationProps {
  show: boolean;
  onHide?: () => void;
  autoHideDuration?: number; // in milliseconds
  text: string;
}

const Confirmation: React.FC<ConfirmationProps> = ({
  show,
  onHide,
  autoHideDuration = 2000, // Default to 2 seconds
  text
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      // Auto-hide after specified duration
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onHide) onHide();
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      return () => {}; // Return empty cleanup function for this path
    }
  }, [show, autoHideDuration, onHide]);

  // Animation classes based on visibility
  const animationClass = isVisible 
    ? 'opacity-100 translate-y-0' 
    : 'opacity-0 translate-y-4';

  return (
    <div 
      className={`fixed top-[53%] left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${animationClass}`}
      aria-live="assertive"
    >
      <div className="bg-gray-700 text-white px-6 py-3 rounded-md shadow-lg flex items-center justify-center space-x-2">
        <span className="font-medium">{text.toUpperCase()}</span>
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 20 20" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          <path 
            d="M7.5 13.5L4 10L3 11L7.5 15.5L17.5 5.5L16.5 4.5L7.5 13.5Z" 
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  );
};

export default Confirmation; 