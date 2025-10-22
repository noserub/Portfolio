import React from 'react';
import { motion } from 'motion/react';

interface ProjectCardSkeletonProps {
  count?: number;
}

export function ProjectCardSkeleton({ count = 6 }: ProjectCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="relative group"
        >
          {/* Simple gray box skeleton - appears instantly */}
          <div className="relative w-full h-80 bg-gray-200 dark:bg-gray-700 rounded-t-2xl rounded-b-3xl overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gray-300 dark:bg-gray-600"
              initial={{ opacity: 0.5 }}
              animate={{ 
                opacity: [0.5, 1, 0.5] 
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>
      ))}
    </>
  );
}
