import React from "react";
import { motion } from "motion/react";
import { Linkedin, Github, Mail } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipProvider,
} from "../ui/tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../ui/utils";

// Custom TooltipContent without arrow for footer - matches home page tooltip styling
function FooterTooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "border border-border shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className,
        )}
        {...props}
      >
        <style>{`
          [data-slot="tooltip-content"] {
            background-color: rgb(17, 24, 39) !important; /* gray-900 */
            color: rgb(255, 255, 255) !important; /* white */
          }
          .dark [data-slot="tooltip-content"] {
            background-color: rgb(255, 255, 255) !important; /* white */
            color: rgb(17, 24, 39) !important; /* gray-900 */
          }
        `}</style>
        {children}
        {/* Arrow removed */}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <TooltipProvider delayDuration={300}>
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative mt-32 pt-8 pb-20"
      >
        {/* Subtle top border with gradient */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center gap-4">
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
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300"
                    aria-label="LinkedIn Profile"
                  >
                    {/* Inverted background on hover - matches home page exactly */}
                    <div className="absolute inset-0 rounded-full bg-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg" />
                    
                    {/* Icon - solid/filled style to match hero */}
                    <Linkedin className="relative z-10 w-5 h-5 text-foreground group-hover:text-background transition-colors duration-300 fill-current" />
                  </motion.a>
                </TooltipTrigger>
                <FooterTooltipContent 
                  sideOffset={8}
                >
                  <p>View my profile on LinkedIn</p>
                </FooterTooltipContent>
              </Tooltip>

              {/* GitHub */}
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <motion.a
                    href="https://github.com/noserub"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300"
                    aria-label="GitHub Profile"
                  >
                    {/* Inverted background on hover - matches home page exactly */}
                    <div className="absolute inset-0 rounded-full bg-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg" />
                    
                    {/* Icon */}
                    <Github className="relative z-10 w-5 h-5 text-foreground group-hover:text-background transition-colors duration-300" />
                  </motion.a>
                </TooltipTrigger>
                <FooterTooltipContent 
                  sideOffset={8}
                >
                  <p>Checkout my GitHub</p>
                </FooterTooltipContent>
              </Tooltip>

              {/* Email */}
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <motion.a
                    href="mailto:brian.bureson@gmail.com"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300"
                    aria-label="Send Email"
                  >
                    {/* Inverted background on hover - matches home page exactly */}
                    <div className="absolute inset-0 rounded-full bg-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg" />
                    
                    {/* Icon */}
                    <Mail className="relative z-10 w-5 h-5 text-foreground group-hover:text-background transition-colors duration-300" />
                  </motion.a>
                </TooltipTrigger>
                <FooterTooltipContent 
                  sideOffset={8}
                >
                  <p>Send me an email</p>
                </FooterTooltipContent>
              </Tooltip>
            </motion.div>

            {/* Copyright Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xs text-foreground/90 dark:text-foreground/85 text-center tracking-wide"
            >
              Made with vibes by Brian Bureson © {currentYear}
            </motion.div>
          </div>
        </div>
      </motion.footer>
    </TooltipProvider>
  );
}

export default Footer;
