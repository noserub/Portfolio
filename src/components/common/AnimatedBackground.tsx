import { motion } from "motion/react";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {/* Base gradient background - lighter, more pastel colors */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "linear-gradient(45deg, rgba(236, 72, 153, 0.15) 0%, rgba(139, 92, 246, 0.15) 25%, rgba(59, 130, 246, 0.15) 50%, rgba(251, 191, 36, 0.15) 100%)",
            "linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 25%, rgba(251, 191, 36, 0.15) 50%, rgba(236, 72, 153, 0.15) 100%)",
            "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(251, 191, 36, 0.15) 25%, rgba(236, 72, 153, 0.15) 50%, rgba(139, 92, 246, 0.15) 100%)",
            "linear-gradient(180deg, rgba(251, 191, 36, 0.15) 0%, rgba(236, 72, 153, 0.15) 25%, rgba(139, 92, 246, 0.15) 50%, rgba(59, 130, 246, 0.15) 100%)",
            "linear-gradient(45deg, rgba(236, 72, 153, 0.15) 0%, rgba(139, 92, 246, 0.15) 25%, rgba(59, 130, 246, 0.15) 50%, rgba(251, 191, 36, 0.15) 100%)",
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Light mode: Very subtle animated color gradient for character */}
      <motion.div
        className="absolute inset-0 dark:opacity-0"
        animate={{
          background: [
            "radial-gradient(circle at 20% 30%, rgba(251, 191, 36, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.12) 0%, transparent 50%)",
            "radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.12) 0%, transparent 50%), radial-gradient(circle at 30% 80%, rgba(59, 130, 246, 0.12) 0%, transparent 50%)",
            "radial-gradient(circle at 70% 20%, rgba(59, 130, 246, 0.12) 0%, transparent 50%), radial-gradient(circle at 40% 60%, rgba(251, 191, 36, 0.12) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 70%, rgba(236, 72, 153, 0.12) 0%, transparent 50%), radial-gradient(circle at 90% 40%, rgba(139, 92, 246, 0.12) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 30%, rgba(251, 191, 36, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.12) 0%, transparent 50%)",
          ],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Overlay for softer appearance - increased to reduce saturation */}
      <div className="absolute inset-0 bg-background/85" />
      
      {/* Van Gogh-style swirly brushstrokes with safe transform animations */}
      <svg
        className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
        viewBox="0 0 1920 1080"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="swirl-bg-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="swirl-bg-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="swirl-bg-3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#ec4899" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="swirl-bg-4" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Large swirling stroke - Top Right with flowing motion */}
        <motion.g
          animate={{
            y: [0, 20, 0],
            x: [0, -15, 0],
            opacity: [0.4, 0.5, 0.4],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path
            d="M1700,50 Q1500,150 1600,300 T1700,500 Q1750,650 1600,700 T1400,800 Q1300,850 1200,750"
            fill="none"
            stroke="url(#swirl-bg-1)"
            strokeWidth="120"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Large swirling stroke - Bottom Left with circular motion */}
        <motion.g
          animate={{
            y: [0, -18, 0],
            x: [0, 12, 0],
            opacity: [0.4, 0.5, 0.4],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path
            d="M100,1000 Q300,950 250,800 T150,600 Q50,450 200,400 T400,300 Q500,250 600,350"
            fill="none"
            stroke="url(#swirl-bg-2)"
            strokeWidth="110"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Large swirling stroke - Center with wave motion */}
        <motion.g
          animate={{
            y: [0, 25, 0],
            x: [0, -12, 0],
            opacity: [0.35, 0.45, 0.35],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path
            d="M700,300 Q900,250 1000,400 T1100,650 Q1050,800 900,750 T700,600 Q600,500 700,400"
            fill="none"
            stroke="url(#swirl-bg-3)"
            strokeWidth="130"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Large swirling stroke - Bottom Right with spiral motion */}
        <motion.g
          animate={{
            y: [0, -22, 0],
            x: [0, 18, 0],
            opacity: [0.4, 0.5, 0.4],
          }}
          transition={{
            duration: 26,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path
            d="M1800,900 Q1600,850 1650,700 T1750,500 Q1800,350 1650,300 T1500,250"
            fill="none"
            stroke="url(#swirl-bg-4)"
            strokeWidth="115"
            strokeLinecap="round"
          />
        </motion.g>
      </svg>
    </div>
  );
}

export default AnimatedBackground;
