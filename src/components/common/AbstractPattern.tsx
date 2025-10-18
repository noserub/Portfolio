import { motion } from "motion/react";

export function AbstractPattern() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
      {/* Large Organic Flowing Strokes - Van Gogh Style with SMOOTH VISIBLE animations */}
      <svg
        className="absolute inset-0 w-full h-full opacity-50"
        viewBox="0 0 1920 1080"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="swirl-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="swirl-gradient-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="swirl-gradient-3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#ec4899" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Organic Swirl 1 - Pink with flowing motion */}
        <motion.g
          animate={{
            y: [0, 15, 0],
            x: [0, 8, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path
            d="M280,280 Q340,350 310,440 T250,580 Q200,620 180,540"
            fill="none"
            stroke="#ec4899"
            strokeWidth="55"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Organic Swirl 2 - Purple with counter-flow */}
        <motion.g
          animate={{
            y: [0, -12, 0],
            x: [0, 10, 0],
            opacity: [0.35, 0.55, 0.35],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        >
          <path
            d="M1520,240 Q1420,270 1380,350 T1420,480 Q1480,540 1560,500 T1600,400 Q1580,320 1520,300"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="60"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Organic Swirl 3 - Blue diagonal flow */}
        <motion.g
          animate={{
            y: [0, 18, 0],
            x: [0, -10, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 19,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.6,
          }}
        >
          <path
            d="M1480,880 Q1560,820 1640,760 T1740,680 Q1780,640 1720,620"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="50"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Organic Swirl 4 - Yellow upward flow */}
        <motion.g
          animate={{
            y: [0, -15, 0],
            x: [0, -12, 0],
            opacity: [0.35, 0.55, 0.35],
          }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.9,
          }}
        >
          <path
            d="M460,850 Q420,770 350,740 T240,680 Q200,640 250,600"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="65"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Large gradient swirl 1 - Sweeping motion */}
        <motion.g
          animate={{
            y: [0, 45, 0],
            x: [0, 25, 0],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path
            d="M100,400 Q200,200 400,300 T700,200 Q900,250 1000,400 T1200,500 Q1400,600 1600,500"
            fill="none"
            stroke="url(#swirl-gradient-1)"
            strokeWidth="60"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Large gradient swirl 2 - Wave motion */}
        <motion.g
          animate={{
            y: [0, -40, 0],
            x: [0, 20, 0],
            opacity: [0.35, 0.55, 0.35],
          }}
          transition={{
            duration: 26,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        >
          <path
            d="M1800,600 Q1600,400 1400,500 T1100,600 Q900,650 800,500 T600,400 Q400,300 200,450"
            fill="none"
            stroke="url(#swirl-gradient-2)"
            strokeWidth="55"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Large gradient swirl 3 - Undulating flow */}
        <motion.g
          animate={{
            y: [0, 42, 0],
            x: [0, -15, 0],
            opacity: [0.35, 0.55, 0.35],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.0,
          }}
        >
          <path
            d="M300,800 Q500,700 700,800 T1100,900 Q1300,950 1500,850 T1800,800"
            fill="none"
            stroke="url(#swirl-gradient-3)"
            strokeWidth="70"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Vertical stroke 1 - Swaying motion */}
        <motion.g
          animate={{
            x: [0, 12, 0],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path
            d="M400,0 Q420,200 400,400 T420,800 Q410,900 400,1080"
            fill="none"
            stroke="#ec4899"
            strokeWidth="45"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Vertical stroke 2 - Counter sway */}
        <motion.g
          animate={{
            x: [0, -15, 0],
            opacity: [0.35, 0.55, 0.35],
          }}
          transition={{
            duration: 21,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.4,
          }}
        >
          <path
            d="M1200,0 Q1180,250 1200,500 T1180,900 Q1190,1000 1200,1080"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="50"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Diagonal flow 1 - Rising motion */}
        <motion.g
          animate={{
            y: [0, -20, 0],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 23,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path
            d="M0,200 Q300,100 600,200 T1200,200 Q1500,250 1920,200"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="55"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Diagonal flow 2 - Falling motion */}
        <motion.g
          animate={{
            y: [0, 18, 0],
            opacity: [0.35, 0.55, 0.35],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.7,
          }}
        >
          <path
            d="M0,900 Q400,800 800,900 T1600,900 Q1800,950 1920,900"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="60"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Additional swirl 1 - Spiraling motion */}
        <motion.g
          animate={{
            y: [0, -18, 0],
            x: [0, 10, 0],
            opacity: [0.35, 0.55, 0.35],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
        >
          <path
            d="M300,250 Q400,200 500,250 T700,300 Q800,350 750,450 T650,600"
            fill="none"
            stroke="#ec4899"
            strokeWidth="65"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Additional swirl 2 - Descending spiral */}
        <motion.g
          animate={{
            y: [0, 15, 0],
            x: [0, -12, 0],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 27,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.8,
          }}
        >
          <path
            d="M1400,700 Q1300,650 1350,550 T1450,400 Q1500,300 1400,250"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="60"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Additional swirl 3 - Wave flow */}
        <motion.g
          animate={{
            y: [0, 22, 0],
            x: [0, 8, 0],
            opacity: [0.35, 0.55, 0.35],
          }}
          transition={{
            duration: 29,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.2,
          }}
        >
          <path
            d="M500,850 Q650,800 750,850 T950,900 Q1050,950 1000,1050"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="70"
            strokeLinecap="round"
          />
        </motion.g>
      </svg>

      {/* Animated spiraling dots - 10 dots for balance */}
      {[...Array(10)].map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const radius = 200 + (i * 30);
        const x = 50 + Math.cos(angle) * (radius / 10);
        const y = 50 + Math.sin(angle) * (radius / 10);
        
        return (
          <motion.div
            key={`spiral-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: `${10 + (i % 3) * 3}px`,
              height: `${10 + (i % 3) * 3}px`,
              background: [
                "#ec4899",
                "#8b5cf6",
                "#3b82f6",
                "#fbbf24",
              ][i % 4],
            }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.5, 1],
              x: [0, Math.cos(angle) * 20, 0],
              y: [0, Math.sin(angle) * 20, 0],
            }}
            transition={{
              duration: 8 + (i % 4),
              repeat: Infinity,
              delay: i * 0.25,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
}

export default AbstractPattern;
