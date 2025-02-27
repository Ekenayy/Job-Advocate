import { Route } from "react-router";
import { SignIn } from "../components/auth/SignIn";
import { SignUp } from "../components/auth/SignUp";

export const publicRoutes = [
  <Route key="root" path="/" element={<SignIn />} />,
  <Route key="sign-in" path="/sign-in" element={<SignIn />} />,
  <Route key="sign-up" path="/sign-up" element={<SignUp />} />
]; 