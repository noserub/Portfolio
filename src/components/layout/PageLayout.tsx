import React from "react";
import { ArrowLeft } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { Button } from "../ui/button";

interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  onBack: () => void;
  overline?: string;
  actionButton?: React.ReactNode;
}

export function PageLayout({ title, children, onBack, overline, actionButton }: PageLayoutProps) {
  const { scrollY } = useScroll();
  
  // Transform scroll position to background opacity (blur is constant like header)
  const backgroundOpacity = useTransform(scrollY, [0, 50], [0, 0.6]);
  const borderOpacity = useTransform(scrollY, [0, 50], [0, 0.5]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen pt-44 pb-32 relative"
    >
      {/* Persistent Back Button - Styled to match Resume button exactly */}
      <div className="fixed top-[6.5rem] left-6 z-40">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={(e) => {
              onBack();
              e.currentTarget.blur(); // Remove focus after click
            }}
            className="relative rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/80 backdrop-blur-sm hover:bg-accent cursor-pointer border border-border h-[54px] flex items-center justify-center"
          >
            <span className="relative z-10 text-foreground font-bold flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </span>
          </button>
        </motion.div>
      </div>

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
            >
              {title}
            </motion.h1>
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
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default PageLayout;