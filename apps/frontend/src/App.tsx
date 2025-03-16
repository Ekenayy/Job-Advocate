import "./App.css";
import { Header } from "./components/layout/Header";
import { useNavigation } from "./context/NavigationContext";
import { useAuth } from "@clerk/chrome-extension";
import { SignIn } from "./components/auth/SignIn";
import { SignUp } from "./components/auth/SignUp";
import { ProtectedContent } from "./components/ProtectedContent";
import { useEffect } from "react";
import { RingLoader } from "react-spinners";

function App() {
  const { currentRoute, navigate } = useNavigation();
  const { isSignedIn, isLoaded } = useAuth();
  
  // Reset navigation when auth state changes
  useEffect(() => {
    if (isLoaded) {
      // If user is signed in, make sure we're not on an auth page
      if (isSignedIn && (currentRoute === '/sign-in' || currentRoute === '/sign-up')) {
        navigate('/');
      }
      
      // If user is not signed in, redirect away from protected routes
      if (!isSignedIn && (currentRoute === '/update-resume')) {
        navigate('/sign-in');
      }
    }
  }, [isSignedIn, isLoaded, currentRoute, navigate]);
  
  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <RingLoader color="#155dfc" size={100} />
        </div>
      </div>
    );
  }
  
  // Render content based on authentication status and current route
  const renderContent = () => {
    // If user is not authenticated, show auth screens
    if (!isSignedIn) {
      switch (currentRoute) {
        case '/sign-up':
          return <SignUp />;
        case '/sign-in':
        case '/':
        default:
          return <SignIn />;
      }
    }
    
    // If user is authenticated, show protected content
    return <ProtectedContent />;
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {renderContent()}
    </div>
  );
}

export default App;
