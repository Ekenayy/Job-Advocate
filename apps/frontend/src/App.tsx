import "./App.css";

import { Header } from "./components/layout/Header";
import { Routes } from "react-router";
import { routes, catchAllRoute } from "./routes";

function App() {
  const routeElements = routes();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Routes>
        {routeElements}
        {catchAllRoute}
      </Routes>
    </div>
  );
}

export default App;
