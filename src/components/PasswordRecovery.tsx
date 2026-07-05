import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { KeyRound } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import {
  clearSupabaseAuthHashFromUrl,
  getAuthErrorMessage,
  hasRecoveryHashInUrl,
} from "../lib/authRecovery";

interface PasswordRecoveryProps {
  onComplete?: () => void;
}

export function PasswordRecovery({ onComplete }: PasswordRecoveryProps) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openRecovery = useCallback(() => {
    setOpen(true);
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    if (hasRecoveryHashInUrl()) {
      openRecovery();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        openRecovery();
      }
    });

    return () => subscription.unsubscribe();
  }, [openRecovery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage("Use at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrorMessage(error.message || "Could not update password.");
        return;
      }

      clearSupabaseAuthHashFromUrl();
      setPassword("");
      setConfirmPassword("");
      setOpen(false);
      onComplete?.();
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/95 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md p-8 bg-card border border-border rounded-3xl shadow-2xl"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">Set a new owner password</h2>
          <p className="text-sm text-muted-foreground text-center">
            Your reset link worked. Choose a new password for edit mode, then you will be signed in.
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <Input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMessage(null);
            }}
            autoFocus
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrorMessage(null);
            }}
          />

          {errorMessage ? (
            <p className="text-sm text-red-500 text-center">{errorMessage}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving…" : "Save password and sign in"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

export default PasswordRecovery;
