import { useEffect, useState } from "react";
import { useUser as useContextUser } from "../context/UserProvder";
import { GmailService } from "../services/gmailService";
import { Onboarding } from "./onboarding/Onboarding";
import ContentApp from "../content/ContentApp";
import { useNavigation } from "../context/NavigationContext";
import UpdateResume from "./layout/UpdateResume";
import { RingLoader } from "react-spinners";

export const ProtectedContent = () => {
  const { isOnboardingComplete, completeOnboarding, checkIfUserIsOnboarded } = useContextUser();
  const [isChecking, setIsChecking] = useState(true);
  const [_hasGmailToken, setHasGmailToken] = useState(false);
  const { currentRoute, navigate } = useNavigation();
  
  // Check if user is onboarded when component mounts
  useEffect(() => {
    const verifyOnboardingStatus = async () => {
      try {
        // Check Gmail token status separately
        const gmailService = GmailService.getInstance();
        const isGmailAuthenticated = await gmailService.isAuthenticated();
        setHasGmailToken(isGmailAuthenticated);
        
        // Check overall onboarding status
        await checkIfUserIsOnboarded();
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setIsChecking(false);
      }
    };
    
    verifyOnboardingStatus();
  }, [checkIfUserIsOnboarded]); 
  
  // Show loading state while checking
  if (isChecking) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <RingLoader color="#155dfc" size={100} />
      </main>
    );
  }
  
  // If the route is /update-resume, show the UpdateResume component
  if (currentRoute === '/update-resume') {
    return (
      <main className="flex-1">
        <div className="p-4">
          <div className="mb-4">
            <button 
              onClick={() => navigate('/')}
              className="text-blue-600 cursor-pointer transition-colors duration-300 hover:text-blue-800"
            >
              &larr; Keep searching for advocates
            </button>
          </div>
          <UpdateResume />
        </div>
      </main>
    );
  }
  
  return (
    <main className="flex-1">
      {!isOnboardingComplete ? (
        <div className="p-4">
          <Onboarding setIsOnboardingComplete={completeOnboarding} />
        </div>
      ) : (
        <ContentApp />
      )}
    </main>
  );
}; 