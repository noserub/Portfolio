import { motion } from "motion/react";
import { Linkedin, Github, Mail } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "../ui/tooltip";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <TooltipProvider delayDuration={300}>
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative mt-32 pt-8 pb-12"
      >
        {/* Subtle top border with gradient */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center gap-8">
            {/* Social Icons - Top */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-5"
            >
              {/* LinkedIn */}
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <motion.a
                    href="https://www.linkedin.com/in/bureson/"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300"
                    aria-label="LinkedIn Profile"
                  >
                    {/* Background with subtle backdrop blur */}
                    <div className="absolute inset-0 rounded-full bg-background/50 dark:bg-background/30 backdrop-blur-sm border border-border/20 group-hover:border-border/50 group-hover:bg-background/70 dark:group-hover:bg-background/50 transition-all duration-300 shadow-sm group-hover:shadow-md" />
                    
                    {/* Icon */}
                    <Linkedin className="relative z-10 w-5 h-5 text-foreground/70 group-hover:text-foreground transition-colors duration-300" />
                  </motion.a>
                </TooltipTrigger>
                <TooltipContent 
                  className="bg-foreground dark:bg-foreground border border-border shadow-lg [&>svg]:hidden"
                  sideOffset={8}
                >
                  <p className="text-background dark:text-background">View my profile on LinkedIn</p>
                </TooltipContent>
              </Tooltip>

              {/* GitHub */}
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <motion.a
                    href="https://github.com/noserub"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300"
                    aria-label="GitHub Profile"
                  >
                    {/* Background */}
                    <div className="absolute inset-0 rounded-full bg-background/50 dark:bg-background/30 backdrop-blur-sm border border-border/20 group-hover:border-border/50 group-hover:bg-background/70 dark:group-hover:bg-background/50 transition-all duration-300 shadow-sm group-hover:shadow-md" />
                    
                    {/* Icon */}
                    <Github className="relative z-10 w-5 h-5 text-foreground/70 group-hover:text-foreground transition-colors duration-300" />
                  </motion.a>
                </TooltipTrigger>
                <TooltipContent 
                  className="bg-foreground dark:bg-foreground border border-border shadow-lg [&>svg]:hidden"
                  sideOffset={8}
                >
                  <p className="text-background dark:text-background">Checkout my GitHub</p>
                </TooltipContent>
              </Tooltip>

              {/* Email */}
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <motion.a
                    href="mailto:brian.bureson@gmail.com"
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300"
                    aria-label="Send Email"
                  >
                    {/* Background */}
                    <div className="absolute inset-0 rounded-full bg-background/50 dark:bg-background/30 backdrop-blur-sm border border-border/20 group-hover:border-border/50 group-hover:bg-background/70 dark:group-hover:bg-background/50 transition-all duration-300 shadow-sm group-hover:shadow-md" />
                    
                    {/* Icon */}
                    <Mail className="relative z-10 w-5 h-5 text-foreground/70 group-hover:text-foreground transition-colors duration-300" />
                  </motion.a>
                </TooltipTrigger>
                <TooltipContent 
                  className="bg-foreground dark:bg-foreground border border-border shadow-lg [&>svg]:hidden"
                  sideOffset={8}
                >
                  <p className="text-background dark:text-background">Send me an email</p>
                </TooltipContent>
              </Tooltip>
            </motion.div>

            {/* Copyright Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xs text-muted-foreground/70 text-center tracking-wide"
            >
              Made with vibes by Brian © {currentYear}
            </motion.div>
          </div>
        </div>
      </motion.footer>
    </TooltipProvider>
  );
}

export default Footer;
