import "./App.css";
import ContentApp from "./content/ContentApp";
import { Onboarding } from "./components/onboarding/Onboarding";
import { useUser } from "./context/UserProvder";
// import { MemoryRouter as Router } from "react-router-dom";

function App() {
  const { isOnboardingComplete, completeOnboarding } = useUser();

  return (
    <main className="main-content">
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

export default App;
