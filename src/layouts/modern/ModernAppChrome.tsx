import type { ReactNode } from "react";
import { ModernNav } from "../../components/modern/ModernNav";
import { usePortfolioProfileNav } from "../../hooks/usePortfolioProfileNav";

interface ModernAppChromeProps {
  currentPage: string;
  logoUrl?: string | null;
  showAbout: boolean;
  showContact: boolean;
  overflowMenu?: ReactNode;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onNavigateHome: () => void;
  onNavigateAbout: () => void;
  onNavigateContact: () => void;
  onScrollToWork?: () => void;
}

export function ModernAppChrome({
  currentPage,
  logoUrl,
  showAbout,
  showContact,
  overflowMenu,
  isDarkMode,
  onThemeToggle,
  onNavigateHome,
  onNavigateAbout,
  onNavigateContact,
  onScrollToWork,
}: ModernAppChromeProps) {
  const { fullName, resumeUrl } = usePortfolioProfileNav();

  return (
    <ModernNav
      ownerName={fullName}
      logoUrl={logoUrl}
      currentPage={currentPage}
      resumeUrl={resumeUrl}
      showAbout={showAbout}
      showContact={showContact}
      overflowMenu={overflowMenu}
      isDarkMode={isDarkMode}
      onThemeToggle={onThemeToggle}
      onNavigateHome={onNavigateHome}
      onNavigateAbout={onNavigateAbout}
      onNavigateContact={onNavigateContact}
      onScrollToWork={onScrollToWork}
    />
  );
}
