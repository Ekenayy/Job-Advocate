import { useEffect, useState, useRef } from "react";
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
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const { currentRoute, navigate } = useNavigation();
  const tokenRefreshAttemptRef = useRef(false);
  
  // Check if user is onboarded when component mounts
  useEffect(() => {
    const verifyOnboardingStatus = async () => {
      if (isRefreshingToken) {
        console.log('Token refresh already in progress, skipping duplicate check');
        return;
      }
      
      try {
        // Check Gmail token status separately, but only if needed
        const lastAuthCheck = await chrome.storage.local.get(['gmailAuthLastChecked']);
        const TEN_MINUTES = 10 * 60 * 1000; // 10 minutes in milliseconds
        
        let isGmailAuthenticated = false;
        
        // Only check Gmail auth if we haven't checked recently
        if (!lastAuthCheck.gmailAuthLastChecked || 
            Date.now() - lastAuthCheck.gmailAuthLastChecked > TEN_MINUTES) {
          console.log('Gmail auth check needed (none or older than 10 minutes)');
          const gmailService = GmailService.getInstance();
          isGmailAuthenticated = await gmailService.isAuthenticated();
          console.log('Gmail auth check result:', isGmailAuthenticated);
          
          // If token is invalid but user is onboarded, try to refresh it once
          if (!isGmailAuthenticated && isOnboardingComplete && !tokenRefreshAttemptRef.current) {
            console.log('Token invalid but user onboarded - attempting silent refresh');
            tokenRefreshAttemptRef.current = true; // Mark that we've attempted refresh
            setIsRefreshingToken(true);
            
            try {
              // Set a timeout for the refresh attempt
              const refreshTimeout = 10000; // 10 seconds
              const timeoutPromise = new Promise((_resolve, reject) => {
                setTimeout(() => reject(new Error('Token refresh timeout')), refreshTimeout);
              });
              
              // Try silent auth with timeout
              await Promise.race([
                gmailService.authenticate(false),
                timeoutPromise
              ]);
              
              // Check if we're authenticated after the refresh
              isGmailAuthenticated = await gmailService.isAuthenticated();
              console.log('Silent token refresh result:', isGmailAuthenticated ? 'success' : 'failed');
            } catch (error) {
              console.error('Silent token refresh failed:', error);
              // Continue with the flow - the user will see onboarding if needed
            } finally {
              setIsRefreshingToken(false);
            }
          }
          
          // Store the check time and result
          if (chrome.storage) {
            await chrome.storage.local.set({
              gmailAuthLastChecked: Date.now(),
              gmailAuthResult: isGmailAuthenticated
            });
          }
        } else {
          // Use the cached result
          isGmailAuthenticated = lastAuthCheck.gmailAuthResult || false;
          console.log('Using cached Gmail auth result:', isGmailAuthenticated);
        }
        
        // Check overall onboarding status
        await checkIfUserIsOnboarded();
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setIsChecking(false);
      }
    };
    
    verifyOnboardingStatus();
  }, [checkIfUserIsOnboarded]); // Don't include isOnboardingComplete to prevent loops
  
  // Show loading state while checking
  if (isChecking || isRefreshingToken) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center">
        <RingLoader color="#155dfc" size={100} />
        <p className="mt-4 text-gray-600">
          {isRefreshingToken 
            ? "Refreshing your authentication..." 
            : "Loading..."}
        </p>
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