import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { Mail, Menu, Moon, Sun, X } from "lucide-react";
import { modernLayout } from "../../design/modernLayout";
import { ModernBrandLogo } from "./ModernBrandLogo";

interface ModernNavProps {
  ownerName: string;
  logoUrl?: string | null;
  currentPage: string;
  showAbout: boolean;
  showContact: boolean;
  showMessages?: boolean;
  unreadMessageCount?: number;
  overflowMenu?: ReactNode;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onNavigateHome: () => void;
  onNavigateAbout: () => void;
  onNavigateContact: () => void;
  onNavigateMessages?: () => void;
  onScrollToWork?: () => void;
}

function navLinkClass(active: boolean) {
  return `modern-nav-link${active ? " modern-nav-link--active" : ""}`;
}

function drawerLinkClass(active: boolean) {
  return `${modernLayout.navMobileDrawerLink}${active ? " modern-nav-drawer-link--active" : ""}`;
}

function shouldLetBrowserHandleNavigation(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

export function ModernNav({
  ownerName,
  logoUrl,
  currentPage,
  showAbout,
  showContact,
  showMessages = false,
  unreadMessageCount = 0,
  overflowMenu,
  isDarkMode,
  onThemeToggle,
  onNavigateHome,
  onNavigateAbout,
  onNavigateContact,
  onNavigateMessages,
  onScrollToWork,
}: ModernNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isWorkActive = currentPage === "home" || currentPage === "project-detail";
  const isMessagesActive = currentPage === "messages";

  const closeMobile = () => setMobileOpen(false);

  const handleMessages = () => {
    onNavigateMessages?.();
    closeMobile();
  };

  const handleWork = () => {
    if (currentPage === "home" && onScrollToWork) {
      window.history.replaceState(window.history.state, "", "/#case-studies");
      onScrollToWork();
    } else {
      onNavigateHome();
      if (onScrollToWork) {
        window.setTimeout(() => {
          window.history.replaceState(window.history.state, "", "/#case-studies");
          onScrollToWork();
        }, 150);
      }
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
      <a
        href="/#case-studies"
        onClick={(event) => {
          if (shouldLetBrowserHandleNavigation(event)) return;
          event.preventDefault();
          handleWork();
        }}
        className={navLinkClass(isWorkActive)}
      >
        Work
      </a>
      {showAbout ? (
        <a
          href="/about"
          onClick={(event) => {
            if (shouldLetBrowserHandleNavigation(event)) return;
            event.preventDefault();
            onNavigateAbout();
          }}
          className={navLinkClass(currentPage === "about")}
        >
          About
        </a>
      ) : null}
      {showContact ? (
        <a
          href="/contact"
          onClick={(event) => {
            if (shouldLetBrowserHandleNavigation(event)) return;
            event.preventDefault();
            onNavigateContact();
          }}
          className={navLinkClass(currentPage === "contact")}
        >
          Contact
        </a>
      ) : null}
    </>
  );

  const mobileDrawerLinks = (
    <>
      <a
        href="/#case-studies"
        onClick={(event) => {
          if (shouldLetBrowserHandleNavigation(event)) return;
          event.preventDefault();
          handleWork();
        }}
        className={drawerLinkClass(isWorkActive)}
      >
        Work
      </a>
      {showAbout ? (
        <a
          href="/about"
          onClick={(event) => {
            if (shouldLetBrowserHandleNavigation(event)) return;
            event.preventDefault();
            onNavigateAbout();
            closeMobile();
          }}
          className={drawerLinkClass(currentPage === "about")}
        >
          About
        </a>
      ) : null}
      {showContact ? (
        <a
          href="/contact"
          onClick={(event) => {
            if (shouldLetBrowserHandleNavigation(event)) return;
            event.preventDefault();
            onNavigateContact();
            closeMobile();
          }}
          className={drawerLinkClass(currentPage === "contact")}
        >
          Contact
        </a>
      ) : null}
    </>
  );

  const messagesButton = showMessages ? (
    <button
      type="button"
      className={`modern-nav-theme-toggle modern-nav-messages-toggle relative${
        unreadMessageCount > 0 ? " modern-nav-messages-toggle--unread" : ""
      }`}
      onClick={handleMessages}
      aria-label={
        unreadMessageCount > 0
          ? `Messages, ${unreadMessageCount} unread`
          : "Messages"
      }
      aria-current={isMessagesActive ? "page" : undefined}
    >
      <Mail size={16} />
      {unreadMessageCount > 0 ? (
        <span className="modern-nav-messages-badge" aria-hidden>
          {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
        </span>
      ) : null}
    </button>
  ) : null;

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

          <a
            href="/"
            onClick={(event) => {
              if (shouldLetBrowserHandleNavigation(event)) return;
              event.preventDefault();
              onNavigateHome();
            }}
            className="modern-nav-brand shrink-0"
            aria-label={`${ownerName} — home`}
          >
            <ModernBrandLogo logoUrl={logoUrl} variant="header" />
          </a>

          <div className={modernLayout.navDesktop}>
            {desktopLinks}
            {messagesButton}
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
            {messagesButton}
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
