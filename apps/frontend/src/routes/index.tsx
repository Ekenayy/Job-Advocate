import { useAuth } from "@clerk/chrome-extension";
import { Route, Navigate } from "react-router";
import { publicRoutes } from "./public";
import { protectedRoutes } from "./protected";

export const routes = () => {
  const { userId } = useAuth();
  
  // Public routes - signed out users
  if (!userId) {
    return publicRoutes;
  }

  // Protected routes - signed in users
  return protectedRoutes;
};

// Catch-all route
export const catchAllRoute = (
  <Route path="*" element={<Navigate to="/" replace />} />
); 