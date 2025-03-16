import { useUser } from "@clerk/chrome-extension";
import { SignIn } from "./SignIn";
import { RingLoader } from "react-spinners";
interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return <RingLoader color="#155dfc" size={100} />
  }

  if (!isSignedIn) {
    return <SignIn />;
  }

  return <>{children}</>;
};