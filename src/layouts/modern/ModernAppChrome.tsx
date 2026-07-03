import type { ReactNode } from "react";
import { ModernNav } from "../../components/modern/ModernNav";
import { usePortfolioProfileNav } from "../../hooks/usePortfolioProfileNav";

interface ModernAppChromeProps {
  currentPage: string;
  logoUrl?: string | null;
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

export function ModernAppChrome({
  currentPage,
  logoUrl,
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
}: ModernAppChromeProps) {
  const { fullName } = usePortfolioProfileNav();

  return (
    <ModernNav
      ownerName={fullName}
      logoUrl={logoUrl}
      currentPage={currentPage}
      showAbout={showAbout}
      showContact={showContact}
      showMessages={showMessages}
      unreadMessageCount={unreadMessageCount}
      overflowMenu={overflowMenu}
      isDarkMode={isDarkMode}
      onThemeToggle={onThemeToggle}
      onNavigateHome={onNavigateHome}
      onNavigateAbout={onNavigateAbout}
      onNavigateContact={onNavigateContact}
      onNavigateMessages={onNavigateMessages}
      onScrollToWork={onScrollToWork}
    />
  );
}
