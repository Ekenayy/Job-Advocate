import { SignUp as ClerkSignUp } from "@clerk/chrome-extension";

export const SignUp = () => {
  return (
    <div className="flex justify-center items-center min-h-screen p-4">
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