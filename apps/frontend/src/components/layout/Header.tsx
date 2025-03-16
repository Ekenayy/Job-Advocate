import { SignInButton, UserButton, useUser } from "@clerk/chrome-extension";
import { HiOutlineDocumentAdd } from "react-icons/hi";
import { useNavigation } from "../../context/NavigationContext";
import { useEffect, useRef } from "react";
export const Header = () => {
  const { isSignedIn } = useUser();
  const { navigate } = useNavigation();
  const userButtonRef = useRef<HTMLDivElement>(null);

  const handleUpdateResumeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/update-resume');
  };

  const handleUserButtonClick = (e: MouseEvent) => {
    if (userButtonRef.current?.contains(e.target as Node)) {
      const target = e.target as HTMLElement;
      if (target.closest('button')?.closest('span')?.textContent === 'Update Resume') {
        e.preventDefault();
        navigate('/update-resume');
      }
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleUserButtonClick);
    return () => document.removeEventListener('click', handleUserButtonClick);
  }, []);

  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-sm">
      <button onClick={() => navigate('/')} className="flex items-center cursor-pointer transition-colors duration-300 hover:text-blue-600">
        {/* Add your logo or app name here */}
        <h1 className="text-xl font-bold">Job Advocate</h1>
      </button>
      
      <div>
        {isSignedIn ? (
          <div ref={userButtonRef} className="flex items-center space-x-4">
            
            <button 
              onClick={handleUpdateResumeClick}
              className="flex items-center text-sm text-gray-400 cursor-pointer transition-colors duration-300 hover:text-blue-600"
            >
              <HiOutlineDocumentAdd className="mr-1 text-2xl" />
              {/* Update Resume */}
            </button>
            
            <UserButton 
              appearance={{
                elements: {
                  userButtonBox: "h-8 w-8",
                  userButtonTrigger: "h-8 w-8"
                }
              }}
            />
          </div>
        ) : (
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Sign In
            </button>
          </SignInButton>
        )}
      </div>
    </header>
  );
};