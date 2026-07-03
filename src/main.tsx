import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SiteAuthProvider } from "./contexts/SiteAuthContext";
import { DesignVariantProvider } from "./design/DesignVariantContext";

function removeSeoPrerender() {
  document.getElementById("seo-prerender")?.remove();
}

removeSeoPrerender();

createRoot(document.getElementById("root")!).render(
  <SiteAuthProvider>
    <DesignVariantProvider>
      <App />
    </DesignVariantProvider>
  </SiteAuthProvider>,
);
  