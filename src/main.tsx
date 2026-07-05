import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SiteAuthProvider } from "./contexts/SiteAuthContext";
import { DesignVariantProvider } from "./design/DesignVariantContext";
import { FontThemeProvider } from "./design/FontThemeContext";
import { DEFAULT_FONT_THEME_ID } from "./design/fontThemes";
import { applyFontTheme } from "./lib/applyFontTheme";

applyFontTheme(DEFAULT_FONT_THEME_ID);

createRoot(document.getElementById("root")!).render(
  <SiteAuthProvider>
    <DesignVariantProvider>
      <FontThemeProvider>
        <App />
      </FontThemeProvider>
    </DesignVariantProvider>
  </SiteAuthProvider>,
);
  