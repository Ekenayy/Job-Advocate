import { SignIn as ClerkSignIn } from "@clerk/chrome-extension";

export const SignIn = () => {
  return (
    <div className="flex justify-center items-center min-h-screen p-4">
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