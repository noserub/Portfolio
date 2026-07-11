"use client";

import type { CSSProperties } from "react";
import { Toaster as Sonner, ToasterProps } from "sonner";

/** Vite app — no next-themes provider; use Sonner directly so toast() never fails silently. */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          zIndex: 200,
        } as CSSProperties
      }
      toastOptions={{
        style: { zIndex: 200 },
      }}
      {...props}
    />
  );
};

export { Toaster };
