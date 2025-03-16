import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the routes we have in our application
export type Route = '/' | '/sign-in' | '/sign-up' | '/update-resume';

interface NavigationContextType {
  currentRoute: Route;
  navigate: (to: Route) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
  initialRoute?: Route;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ 
  children, 
  initialRoute = '/' 
}) => {
  const [routeHistory, setRouteHistory] = useState<Route[]>([initialRoute]);
  
  const navigate = (to: Route) => {
    setRouteHistory(prev => [...prev, to]);
  };
  
  const goBack = () => {
    if (routeHistory.length > 1) {
      setRouteHistory(prev => prev.slice(0, -1));
    }
  };
  
  const currentRoute = routeHistory[routeHistory.length - 1];
  
  return (
    <NavigationContext.Provider value={{ currentRoute, navigate, goBack }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}; 