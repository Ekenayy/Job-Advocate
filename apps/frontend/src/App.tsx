import "./App.css";
import ContentApp from "./content/ContentApp";
import { Onboarding } from "./components/onboarding/Onboarding";
import { useUser as useContextUser } from "./context/UserProvder";
import { AuthWrapper } from "./components/auth/AuthWrapper";
import { Header } from "./components/layout/Header";
// import { MemoryRouter as Router } from "react-router-dom";

function App() {
  const { isOnboardingComplete, completeOnboarding } = useContextUser();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <AuthWrapper>
        <main className="flex-1">
          {!isOnboardingComplete ? (
            <div className="p-4">
              <Onboarding setIsOnboardingComplete={completeOnboarding} />
            </div>
          ) : (
            <ContentApp />
          )}
        </main>
      </AuthWrapper>
    </div>
  );
}

export default App;
