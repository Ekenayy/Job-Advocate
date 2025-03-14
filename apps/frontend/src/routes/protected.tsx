import { Route } from "react-router";
import ContentApp from "../content/ContentApp";
import { Onboarding } from "../components/onboarding/Onboarding";
import { useUser as useContextUser } from "../context/UserProvder";
import { useEffect, useState } from "react";
import { GmailService } from "../services/gmailService";

function ProtectedContent() {
  const { isOnboardingComplete, completeOnboarding, checkIfUserIsOnboarded } = useContextUser();
  const [isChecking, setIsChecking] = useState(true);
  const [_hasGmailToken, setHasGmailToken] = useState(false);
  
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
        <p>Checking onboarding status...</p>
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
}

export const protectedRoutes = [
  <Route key="root" path="/" element={<ProtectedContent />} />,
  // Add other protected routes here
]; 