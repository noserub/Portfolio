import { useEffect, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Edit2 } from "lucide-react";
import { modern, modernFont } from "../../design/modernTokens";

export interface ModernEditorShellProps {
  open: boolean;
  title: string;
  titleId?: string;
  onCancel: () => void;
  onDone: () => void;
  saving?: boolean;
  /** When true, clicking the backdrop saves (onDone) instead of discarding. Default true. */
  backdropSaves?: boolean;
  children: ReactNode;
  bodyRef?: RefObject<HTMLDivElement | null>;
}

export function ModernEditorShell({
  open,
  title,
  titleId,
  onCancel,
  onDone,
  saving = false,
  backdropSaves = true,
  children,
  bodyRef,
}: ModernEditorShellProps) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    bodyRef?.current?.scrollTo({ top: 0 });
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open, bodyRef]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || saving) return;
      e.preventDefault();
      onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel, saving]);

  if (!open) return null;

  const handleBackdrop = () => {
    if (saving) return;
    if (backdropSaves) onDone();
    else onCancel();
  };

  const actions = (
    <div className="flex items-center justify-end gap-2 shrink-0">
      <button
        type="button"
        className="modern-home-hero-editor__btn"
        style={modernFont}
        disabled={saving}
        onClick={onCancel}
      >
        Cancel
      </button>
      <button
        type="button"
        className="modern-home-hero-editor__btn modern-home-hero-editor__btn--primary"
        style={modernFont}
        disabled={saving}
        onClick={onDone}
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );

  return createPortal(
    <div
      className="modern-home-hero-editor fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-label={titleId ? undefined : title}
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="modern-home-hero-editor__backdrop"
        aria-label={backdropSaves ? "Save changes and close" : "Cancel editing"}
        onClick={handleBackdrop}
      />
      <div className="modern-home-hero-editor__sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modern-home-hero-editor__header">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Edit2 className="w-4 h-4 shrink-0" style={{ color: modern.accent }} aria-hidden />
              <h2 id={titleId} className="text-base font-semibold truncate" style={modernFont}>
                {title}
              </h2>
            </div>
            <p className="text-xs truncate pl-6" style={{ ...modernFont, color: modern.muted }}>
              {backdropSaves ? "Save or click outside to keep changes" : "Save to apply changes"}
            </p>
          </div>
          <div className="modern-home-hero-editor__header-actions">{actions}</div>
        </div>
        <div ref={bodyRef} className="modern-home-hero-editor__body space-y-6">
          {children}
        </div>
        <div className="modern-home-hero-editor__footer">{actions}</div>
      </div>
    </div>,
    document.body,
  );
}

interface ModernEditorDialogProps {
  open: boolean;
  title: string;
  onCancel: () => void;
  onDone: () => void;
  saving?: boolean;
  children: ReactNode;
}

export function ModernEditorDialog({
  open,
  title,
  onCancel,
  onDone,
  saving = false,
  children,
}: ModernEditorDialogProps) {
  return (
    <ModernEditorShell open={open} title={title} onCancel={onCancel} onDone={onDone} saving={saving}>
      {children}
    </ModernEditorShell>
  );
}

export function ModernEditorField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium block" style={modernFont}>
        {label}
      </label>
      {hint ? (
        <p className="text-xs" style={{ ...modernFont, color: modern.muted }}>
          {hint}
        </p>
      ) : null}
      {children}
    </div>
  );
}

export const modernEditorInputStyle = {
  borderColor: modern.border,
  color: modern.text,
  background: modern.surfaceInset,
} as const;
