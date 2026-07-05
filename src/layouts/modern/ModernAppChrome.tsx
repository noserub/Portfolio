import type { ReactNode } from "react";
import { ModernNav } from "../../components/modern/ModernNav";
import { usePortfolioProfileNav } from "../../hooks/usePortfolioProfileNav";

interface ModernAppChromeProps {
  currentPage: string;
  logoUrl?: string | null;
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

export function ModernAppChrome({
  currentPage,
  logoUrl,
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
}: ModernAppChromeProps) {
  const { fullName } = usePortfolioProfileNav();

  return (
    <ModernNav
      ownerName={fullName}
      logoUrl={logoUrl}
      currentPage={currentPage}
      showWriting={showWriting}
      showAbout={showAbout}
      showContact={showContact}
      overflowMenu={overflowMenu}
      isDarkMode={isDarkMode}
      onThemeToggle={onThemeToggle}
      onNavigateHome={onNavigateHome}
      onNavigateWriting={onNavigateWriting}
      onNavigateAbout={onNavigateAbout}
      onNavigateContact={onNavigateContact}
      onScrollToWork={onScrollToWork}
    />
  );
}
