import { motion } from "motion/react";
import { useState } from "react";

interface FloatingImageProps {
  src: string;
  alt: string;
  delay?: number;
  onClick: () => void;
  onReplace: (file: File) => void;
}

export function FloatingImage({
  src,
  alt,
  delay = 0,
  onClick,
  onReplace,
}: FloatingImageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onReplace(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      onReplace(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      whileHover={{ scale: 1.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <motion.div
        animate={{
          y: isHovered ? -8 : [0, -10, 0],
          rotateY: isHovered ? 5 : 0,
          rotateX: isHovered ? -5 : 0,
        }}
        transition={{
          y: isHovered ? { duration: 0.3 } : { duration: 4, repeat: Infinity, ease: "easeInOut" },
          rotateY: { duration: 0.3 },
          rotateX: { duration: 0.3 },
        }}
        style={{ transformStyle: "preserve-3d" }}
        className="cursor-pointer relative"
      >
        <div
          onClick={onClick}
          className={`aspect-square overflow-hidden rounded-2xl bg-muted shadow-2xl transition-shadow ${
            isDragging ? "ring-4 ring-primary" : ""
          }`}
        >
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center backdrop-blur-sm"
        >
          <label className="cursor-pointer text-white text-center px-4">
            <p className="mb-2">Click to view</p>
            <p className="text-sm opacity-80">or drag new image to replace</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              onClick={(e) => e.stopPropagation()}
            />
          </label>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default FloatingImage;