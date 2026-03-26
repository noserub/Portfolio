import { useState } from "react";
import { motion } from "motion/react";
import { Lock, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 hover:bg-accent rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-500/10 rounded-full">
            <Lock className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Password required</h2>
            <p className="text-sm text-muted-foreground mt-1">{projectTitle}</p>
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
              className={error ? "border-red-500" : ""}
            />
            {error ? <p className="text-red-500 text-sm mt-2">{error}</p> : null}
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Checking…" : "Unlock"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={submitting}>
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default CaseStudyPasswordPrompt;
