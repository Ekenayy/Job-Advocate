import { useUser } from "@clerk/chrome-extension";
import { SignIn } from "./SignIn";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <SignIn />;
  }

  return <>{children}</>;
};