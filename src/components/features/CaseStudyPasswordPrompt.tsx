import { useState } from "react";
import { motion } from "motion/react";
import { Lock, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useDesignVariant } from "../../design/DesignVariantContext";
import { modernFont, modernPrimaryButtonStyle } from "../../design/modernTokens";

interface CaseStudyPasswordPromptProps {
  projectTitle: string;
  /** Server-side verification (e.g. unlock RPC); return true to close the modal. */
  onUnlock: (password: string) => Promise<boolean>;
  onCancel: () => void;
}

export function CaseStudyPasswordPrompt({
  projectTitle,
  onUnlock,
  onCancel,
}: CaseStudyPasswordPromptProps) {
  const { effectiveVariant } = useDesignVariant();
  const isModern = effectiveVariant(false) === "modern";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const ok = await onUnlock(password);
      if (ok) {
        setPassword("");
      } else {
        setError("Incorrect password");
        setPassword("");
      }
    } catch {
      setError("Could not verify password. Try again.");
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="case-study-password-dialog-overlay fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="case-study-password-dialog bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-study-password-title"
      >
        <button
          type="button"
          onClick={onCancel}
          className="case-study-password-dialog__close absolute top-4 right-4 p-2 hover:bg-accent rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="case-study-password-dialog__icon-wrap p-3 rounded-full">
            <Lock className="case-study-password-dialog__icon w-6 h-6" />
          </div>
          <div>
            <h2 id="case-study-password-title" className="case-study-password-dialog__title text-2xl font-bold">
              Password required
            </h2>
            <p className="case-study-password-dialog__subtitle text-sm text-muted-foreground mt-1">
              {projectTitle}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <Input
              id="case-study-unlock-password"
              name="case-study-unlock"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter password"
              autoComplete="new-password"
              autoFocus
              disabled={submitting}
              className={`case-study-password-dialog__input${error ? " case-study-password-dialog__input--error" : ""}`}
            />
            {error ? (
              <p className="case-study-password-dialog__error text-sm mt-2">{error}</p>
            ) : null}
          </div>

          <div className="flex gap-3">
            {isModern ? (
              <>
                <button
                  type="submit"
                  className="case-study-password-dialog__submit modern-btn-primary flex-1 disabled:opacity-60"
                  style={modernPrimaryButtonStyle}
                  disabled={submitting}
                >
                  {submitting ? "Checking…" : "Unlock"}
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="case-study-password-dialog__cancel modern-btn-outline flex-1 disabled:opacity-60"
                  style={modernFont}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <Button type="submit" className="case-study-password-dialog__submit flex-1" disabled={submitting}>
                  {submitting ? "Checking…" : "Unlock"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="case-study-password-dialog__cancel flex-1"
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default CaseStudyPasswordPrompt;
