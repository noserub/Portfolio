import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { KeyRound } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import {
  clearPendingPasswordRecovery,
  clearSupabaseAuthHashFromUrl,
  getAuthErrorMessage,
  hasPendingPasswordRecovery,
  hasRecoveryHashInUrl,
} from "../lib/authRecovery";

interface PasswordRecoveryProps {
  onComplete?: () => void;
  /** Increment to open the form for a signed-in user who already has a session. */
  openSignal?: number;
}

export function PasswordRecovery({ onComplete, openSignal = 0 }: PasswordRecoveryProps) {
  const [open, setOpen] = useState(false);
  const [fromRecoveryLink, setFromRecoveryLink] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const consumedPendingRef = useRef(false);

  const openRecovery = useCallback((recoveryLink: boolean) => {
    setFromRecoveryLink(recoveryLink);
    setOpen(true);
    setErrorMessage(null);
  }, []);

  const dismiss = useCallback(() => {
    clearPendingPasswordRecovery();
    clearSupabaseAuthHashFromUrl();
    setPassword("");
    setConfirmPassword("");
    setErrorMessage(null);
    setOpen(false);
  }, []);

  useEffect(() => {
    const openIfPendingOnce = () => {
      if (consumedPendingRef.current) return;
      if (!hasRecoveryHashInUrl() && !hasPendingPasswordRecovery()) return;
      consumedPendingRef.current = true;
      // Consume the flag so a later refresh does not reopen forever.
      clearPendingPasswordRecovery();
      clearSupabaseAuthHashFromUrl();
      openRecovery(true);
    };

    openIfPendingOnce();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        if (consumedPendingRef.current) return;
        consumedPendingRef.current = true;
        clearPendingPasswordRecovery();
        clearSupabaseAuthHashFromUrl();
        openRecovery(true);
        return;
      }
      // Only the first SIGNED_IN after a recovery callback should open the form.
      if (event === "SIGNED_IN") {
        openIfPendingOnce();
      }
    });

    const retry = window.setTimeout(openIfPendingOnce, 0);
    const retryLate = window.setTimeout(openIfPendingOnce, 500);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(retry);
      window.clearTimeout(retryLate);
    };
  }, [openRecovery]);

  useEffect(() => {
    if (openSignal > 0) {
      openRecovery(false);
    }
  }, [openSignal, openRecovery]);

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

      clearPendingPasswordRecovery();
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
            {fromRecoveryLink
              ? "Your reset link signed you in. Choose a new password for edit mode before you continue."
              : "Choose a new password for edit mode. This replaces the password you use to sign in."}
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
            autoComplete="new-password"
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrorMessage(null);
            }}
            autoComplete="new-password"
          />

          {errorMessage ? (
            <p className="text-sm text-red-500 text-center">{errorMessage}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving…" : "Save password"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={saving}
            onClick={dismiss}
          >
            Not now
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

export default PasswordRecovery;
