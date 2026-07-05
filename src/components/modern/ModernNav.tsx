import { useEffect, useState, type ReactNode } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { modernLayout } from "../../design/modernLayout";
import { ModernBrandLogo } from "./ModernBrandLogo";

interface ModernNavProps {
  ownerName: string;
  logoUrl?: string | null;
  currentPage: string;
  showWriting: boolean;
  showAbout: boolean;
  showContact: boolean;
  overflowMenu?: ReactNode;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onNavigateHome: () => void;
  onNavigateWriting: () => void;
  onNavigateAbout: () => void;
  onNavigateContact: () => void;
  onScrollToWork?: () => void;
}

function navLinkClass(active: boolean) {
  return `modern-nav-link${active ? " modern-nav-link--active" : ""}`;
}

function drawerLinkClass(active: boolean) {
  return `${modernLayout.navMobileDrawerLink}${active ? " modern-nav-drawer-link--active" : ""}`;
}

export function ModernNav({
  ownerName,
  logoUrl,
  currentPage,
  showWriting,
  showAbout,
  showContact,
  overflowMenu,
  isDarkMode,
  onThemeToggle,
  onNavigateHome,
  onNavigateWriting,
  onNavigateAbout,
  onNavigateContact,
  onScrollToWork,
}: ModernNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isWorkActive = currentPage === "home" || currentPage === "project-detail";
  const isWritingActive = currentPage === "writing" || currentPage === "writing-detail";

  const closeMobile = () => setMobileOpen(false);

  const handleWork = () => {
    if (currentPage === "home" && onScrollToWork) {
      onScrollToWork();
    } else {
      onNavigateHome();
      if (onScrollToWork) window.setTimeout(onScrollToWork, 150);
    }
    closeMobile();
  };

  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobile();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const desktopLinks = (
    <>
      <button type="button" onClick={handleWork} className={navLinkClass(isWorkActive)}>
        Work
      </button>
      {showWriting ? (
        <button
          type="button"
          onClick={onNavigateWriting}
          className={navLinkClass(isWritingActive)}
        >
          Writing
        </button>
      ) : null}
      {showAbout ? (
        <button
          type="button"
          onClick={onNavigateAbout}
          className={navLinkClass(currentPage === "about")}
        >
          About
        </button>
      ) : null}
      {showContact ? (
        <button
          type="button"
          onClick={onNavigateContact}
          className={navLinkClass(currentPage === "contact")}
        >
          Contact
        </button>
      ) : null}
    </>
  );

  const mobileDrawerLinks = (
    <>
      <button type="button" onClick={handleWork} className={drawerLinkClass(isWorkActive)}>
        Work
      </button>
      {showWriting ? (
        <button
          type="button"
          onClick={() => {
            onNavigateWriting();
            closeMobile();
          }}
          className={drawerLinkClass(isWritingActive)}
        >
          Writing
        </button>
      ) : null}
      {showAbout ? (
        <button
          type="button"
          onClick={() => {
            onNavigateAbout();
            closeMobile();
          }}
          className={drawerLinkClass(currentPage === "about")}
        >
          About
        </button>
      ) : null}
      {showContact ? (
        <button
          type="button"
          onClick={() => {
            onNavigateContact();
            closeMobile();
          }}
          className={drawerLinkClass(currentPage === "contact")}
        >
          Contact
        </button>
      ) : null}
    </>
  );

  return (
    <>
      <nav
        className={`modern-nav-bar fixed top-0 left-0 right-0 z-50 backdrop-blur-md ${modernLayout.sectionX}`}
      >
        <div className={`${modernLayout.container} ${modernLayout.navInner}`}>
          <div className={modernLayout.navMobileLeading}>
            <button
              type="button"
              className={modernLayout.navMenuToggle}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="modern-nav-drawer"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <button
            type="button"
            onClick={onNavigateHome}
            className="modern-nav-brand shrink-0"
            aria-label={`${ownerName} — home`}
          >
            <ModernBrandLogo logoUrl={logoUrl} variant="header" />
          </button>

          <div className={modernLayout.navDesktop}>
            {desktopLinks}
            <button
              type="button"
              className="modern-nav-theme-toggle"
              onClick={onThemeToggle}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {overflowMenu}
          </div>

          <div className={modernLayout.navMobileTrailing}>
            <button
              type="button"
              className="modern-nav-theme-toggle"
              onClick={onThemeToggle}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {overflowMenu}
          </div>
        </div>
      </nav>

      <div
        className={`${modernLayout.navMobileDrawerRoot}${mobileOpen ? " modern-nav-drawer-root--open" : ""}`}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className={modernLayout.navMobileDrawerBackdrop}
          onClick={closeMobile}
          aria-label="Close menu"
          tabIndex={mobileOpen ? 0 : -1}
        />
        <aside
          id="modern-nav-drawer"
          className={modernLayout.navMobileDrawer}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          aria-hidden={!mobileOpen}
        >
          <div className={modernLayout.navMobileDrawerInner}>{mobileDrawerLinks}</div>
        </aside>
      </div>
    </>
  );
}
