import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, onKeyDown, ...props }: React.ComponentProps<"textarea">) {
  // Ensure native browser undo/redo works properly
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-none border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-input-background px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}

export { Textarea };
