import React from "react";
import { motion } from "motion/react";

interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  onBack: () => void;
  overline?: string;
  actionButton?: React.ReactNode;
  subtitle?: string;
}

/**
 * Plain divs for the main shell — motion/transform ancestors break position:sticky
 * in case study sidebars (see ProjectDetail right column).
 */
export function PageLayout({ title, children, onBack, overline, actionButton, subtitle }: PageLayoutProps) {
  return (
    <div className="min-h-screen pt-44 pb-32 relative">
      {/* Back button moved to main header - see App.tsx */}

      {/* 
        TOOLBAR LAYOUT:
        - Global toolbar (top-24): Logo, theme toggle, sign in, back button (left), tabs (center)
        - Contextual toolbar (top-[6.5rem]): Page-specific action buttons can be placed in the right area
        - Body content: Starts at pt-44 to leave room for toolbars
      */}
      
      {/* Contextual Action Button Area - Top Right, aligned with tabs and back button */}
      {actionButton && (
        <div className="fixed top-[6.5rem] right-6 z-40 hidden lg:block">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {actionButton}
          </motion.div>
        </div>
      )}

      <div className="w-full" style={{ maxWidth: '100%' }}>
        {/* Page Title */}
        <div className="mb-32 px-6" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div>
            {overline && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm tracking-wider text-muted-foreground mb-2"
                style={{ fontSize: '12pt' }}
              >
                {overline}
              </motion.div>
            )}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-foreground"
            >
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="mt-3 text-lg text-muted-foreground max-w-3xl"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
          {/* Action button shows here on mobile */}
          {actionButton && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 lg:hidden"
            >
              {actionButton}
            </motion.div>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

export default PageLayout;
