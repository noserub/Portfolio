
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SiteAuthProvider } from "./contexts/SiteAuthContext";

createRoot(document.getElementById("root")!).render(
  <SiteAuthProvider>
    <App />
  </SiteAuthProvider>,
);
  