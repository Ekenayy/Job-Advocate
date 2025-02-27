import {useRef, useEffect} from "react";
import { SignUp as ClerkSignUp } from "@clerk/chrome-extension";
import { useNavigate } from "react-router";

export const SignUp = () => {
  const signUpRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleClick = (e: MouseEvent) => {
    if (signUpRef.current?.contains(e.target as Node)) {
      const target = e.target as HTMLElement;
      if (target.closest('a')?.href?.includes('sign-in')) {
        e.preventDefault();
        navigate('/sign-in');
      }
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
  
  return (
    <div className="flex justify-center items-center min-h-screen p-4" ref={signUpRef}>
      <ClerkSignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-white rounded-lg shadow-md",
          }
        }}
      />
    </div>
  );
};