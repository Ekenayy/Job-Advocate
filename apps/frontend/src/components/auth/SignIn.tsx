import {useRef, useEffect} from "react";
import { SignIn as ClerkSignIn } from "@clerk/chrome-extension";
import { useNavigate } from "react-router";

export const SignIn = () => {
  const signInRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleClick = (e: MouseEvent) => {
    if (signInRef.current?.contains(e.target as Node)) {
      const target = e.target as HTMLElement;
      if (target.closest('a')?.href?.includes('sign-up')) {
        e.preventDefault();
        navigate('/sign-up');
      }
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen p-4" ref={signInRef}>
      <ClerkSignIn
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