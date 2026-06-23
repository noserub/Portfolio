import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { modern, modernFont } from "../../design/modernTokens";

interface ModernCmsEditorOverlayProps {
  open: boolean;
  title: string;
  onDone: () => void;
  children: ReactNode;
}

/**
 * Full-screen CMS editor shell — portaled to document.body so position:fixed is not
 * trapped by transformed ancestors (App chrome, motion wrappers).
 */
export function ModernCmsEditorOverlay({ open, title, onDone, children }: ModernCmsEditorOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: modern.bg }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b"
        style={{ borderColor: modern.border, background: modern.bg }}
      >
        <p className="text-sm font-medium truncate" style={modernFont}>
          {title}
        </p>
        <button
          type="button"
          className="modern-home-hero-editor__btn modern-home-hero-editor__btn--primary shrink-0"
          style={modernFont}
          onClick={onDone}
        >
          Done
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-6" data-design="classic">
        {children}
      </div>
    </div>,
    document.body,
  );
}
