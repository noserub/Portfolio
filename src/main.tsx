import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SiteAuthProvider } from "./contexts/SiteAuthContext";
import { ContactMessagesProvider } from "./contexts/ContactMessagesContext";
import { DesignVariantProvider } from "./design/DesignVariantContext";
import { ensureLocalStorageWritable } from "./lib/localStorageQuota";

function removeSeoPrerender() {
  document.getElementById("seo-prerender")?.remove();
}

removeSeoPrerender();
ensureLocalStorageWritable();

createRoot(document.getElementById("root")!).render(
  <SiteAuthProvider>
    <ContactMessagesProvider>
      <DesignVariantProvider>
        <App />
      </DesignVariantProvider>
    </ContactMessagesProvider>
  </SiteAuthProvider>,
);
  