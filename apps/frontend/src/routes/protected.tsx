import { Route } from "react-router";
import ContentApp from "../content/ContentApp";
import { Onboarding } from "../components/onboarding/Onboarding";
import { useUser as useContextUser } from "../context/UserProvder";

function ProtectedContent() {
  const { isOnboardingComplete, completeOnboarding } = useContextUser();
  
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