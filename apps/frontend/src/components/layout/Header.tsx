import { SignInButton, UserButton, useUser } from "@clerk/chrome-extension";
import { HiOutlineDocumentAdd } from "react-icons/hi";
import UpdateResume from "./UpdateResume";

export const Header = () => {
  const { isSignedIn } = useUser();

  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-sm">
      <div className="flex items-center">
        {/* Add your logo or app name here */}
        <h1 className="text-xl font-bold">Job Advocate</h1>
      </div>
      
      <div>
        {isSignedIn ? (
          <UserButton 
            appearance={{
              elements: {
                userButtonBox: "h-8 w-8",
                userButtonTrigger: "h-8 w-8"
              }
            }}
          >
            <UserButton.UserProfilePage 
              label="Update Resume"
              url="/update-resume"
              labelIcon={<HiOutlineDocumentAdd />}
            >
              <UpdateResume />
            </UserButton.UserProfilePage>

          </UserButton>
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