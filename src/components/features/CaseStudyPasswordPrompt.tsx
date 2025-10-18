import { useState } from "react";
import { motion } from "motion/react";
import { Lock, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const DEFAULT_PASSWORD = "0p3n";

interface CaseStudyPasswordPromptProps {
  projectTitle: string;
  onCorrectPassword: () => void;
  onCancel: () => void;
}

export function CaseStudyPasswordPrompt({ 
  projectTitle, 
  onCorrectPassword, 
  onCancel 
}: CaseStudyPasswordPromptProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get stored password or use default
    const storedPassword = localStorage.getItem('caseStudyPassword') || DEFAULT_PASSWORD;
    
    if (password === storedPassword) {
      onCorrectPassword();
    } else {
      setError("Incorrect password");
      setPassword("");
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
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 hover:bg-accent rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter password"
              autoFocus
              className={error ? "border-red-500" : ""}
            />
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1">
              Unlock
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            💡 Password can be reset by the site owner in edit mode
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default CaseStudyPasswordPrompt;
