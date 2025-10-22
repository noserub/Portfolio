import React from 'react';
import { motion } from 'motion/react';

interface ProjectCardSkeletonProps {
  count?: number;
}

export function ProjectCardSkeleton({ count = 6 }: ProjectCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={`skeleton-${index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative group cursor-pointer"
        >
          {/* Main card container with same dimensions as actual cards */}
          <div className="relative w-full h-80 bg-gray-100 dark:bg-gray-800 rounded-t-2xl rounded-b-3xl overflow-hidden">
            {/* Image skeleton */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse">
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
            
            {/* Content overlay skeleton */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Title skeleton */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="h-6 bg-white/20 rounded-md mb-2 animate-pulse" style={{ width: '70%' }} />
              <div className="h-4 bg-white/15 rounded-md animate-pulse" style={{ width: '50%' }} />
            </div>
            
            {/* Description badge skeleton */}
            <div className="absolute bottom-4 left-4">
              <div className="h-5 bg-white/20 rounded-full animate-pulse" style={{ width: '120px' }} />
            </div>
          </div>
        </motion.div>
      ))}
    </>
  );
}

// Shimmer animation keyframes (add to CSS)
export const skeletonStyles = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`;
