import { Upload } from "lucide-react";
import { motion } from "motion/react";

interface HeaderProps {
  logo?: string;
  onLogoUpload: (file: File) => void;
  onLogoClick?: () => void;
  isEditMode?: boolean;
}

export function Header({ logo, onLogoUpload, onLogoClick, isEditMode = false }: HeaderProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLogoUpload(file);
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-md border-b border-border/50"
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-center">
        <div 
          className="relative group cursor-pointer"
          onClick={() => !isEditMode && onLogoClick?.()}
        >
          {logo ? (
            <img 
              src={logo} 
              alt="Logo" 
              className="h-12 object-contain dark:brightness-0 dark:invert transition-all duration-300 hover:opacity-80" 
              onLoad={() => console.log('🖼️ Logo loaded successfully:', logo.substring(0, 50) + '...')}
              onError={() => console.error('❌ Logo failed to load:', logo.substring(0, 50) + '...')}
            />
          ) : (
            <div className="h-12 w-32 bg-muted/50 rounded-lg flex items-center justify-center backdrop-blur-sm hover:opacity-80 transition-opacity">
              <span className="text-muted-foreground">Logo</span>
            </div>
          )}
          {isEditMode && (
            <label className="absolute inset-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>
    </motion.header>
  );
}

export default Header;