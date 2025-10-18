import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, onKeyDown, ...props }: React.ComponentProps<"input">) {
  // Ensure native browser undo/redo works properly
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow native browser undo/redo (Ctrl+Z, Ctrl+Y, Cmd+Z, Cmd+Shift+Z)
    // Don't interfere with these at all
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'y' || e.key === 'Z' || e.key === 'Y')) {
      // Let the browser handle it natively
      // Don't call preventDefault or stopPropagation
    }
    
    // Call the original onKeyDown if provided
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}

export { Input };
