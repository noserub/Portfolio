import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Lock } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

interface SignInProps {
  onSignIn: () => void;
  onCancel: () => void;
}

export function SignIn({ onSignIn, onCancel }: SignInProps) {
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const ownerEmail = import.meta.env.VITE_SITE_OWNER_SIGNIN_EMAIL?.trim();
    if (!ownerEmail) {
      setErrorMessage(
        "Sign-in email is not configured (set VITE_SITE_OWNER_SIGNIN_EMAIL).",
      );
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: ownerEmail,
        password: password,
      });

      if (signInError) {
        setPassword("");
        setErrorMessage(signInError.message || "Sign-in failed. Please try again.");
        return;
      }

      // Prefer session (always set on success); user can be omitted in edge cases.
      if (data.session ?? data.user) {
        onSignIn();
        setPassword("");
        return;
      }

      setPassword("");
      setErrorMessage("Could not establish a session. Try again or check Supabase Auth settings.");
    } catch {
      setPassword("");
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-purple-50/40 dark:from-slate-900/20 dark:via-blue-900/10 dark:to-purple-900/10 backdrop-blur-md rounded-3xl border border-border shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="mb-2">Site Owner Access</h2>
          <p className="text-sm text-muted-foreground text-center">
            Enter your password to access edit mode
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage(null);
              }}
              className={`text-center ${errorMessage ? "border-red-500 dark:border-red-500" : ""}`}
              autoFocus
            />
          </div>

          {errorMessage && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500 text-center"
            >
              {errorMessage}
            </motion.p>
          )}

          <div className="flex gap-3">
            <Button type="submit" className="flex-1">
              Sign In
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Visitors can browse the site normally without signing in.
        </p>
      </motion.div>
    </div>
  );
}

export default SignIn;
