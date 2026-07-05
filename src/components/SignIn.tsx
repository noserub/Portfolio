import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Lock } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import {
  clearSupabaseAuthHashFromUrl,
  getAuthErrorMessage,
  hasRecoveryHashInUrl,
  isSupabaseConfigured,
} from "../lib/authRecovery";
import {
  ensureLocalStorageHeadroom,
  formatStorageMegabytes,
  isQuotaExceededError,
} from "../lib/safeLocalStorage";

interface SignInProps {
  onSignIn: () => void;
  onCancel: () => void;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

export function SignIn({ onSignIn, onCancel }: SignInProps) {
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [sendingReset, setSendingReset] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const ownerEmail = import.meta.env.VITE_SITE_OWNER_SIGNIN_EMAIL?.trim() ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!isSupabaseConfigured()) {
      setErrorMessage(
        "Supabase is not configured for local dev. Add VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_SITE_OWNER_SIGNIN_EMAIL to .env.local, then restart the dev server.",
      );
      return;
    }

    if (!ownerEmail) {
      setErrorMessage(
        "Sign-in email is not configured (set VITE_SITE_OWNER_SIGNIN_EMAIL).",
      );
      return;
    }

    setSubmitting(true);
    try {
      const headroom = ensureLocalStorageHeadroom();
      if (!headroom.ok) {
        setErrorMessage(
          `Browser storage is full (${formatStorageMegabytes(headroom.usageBytes)} used). Open ${window.location.origin}${window.location.pathname}?emergency=true to free space, or clear site data for localhost in browser settings.`,
        );
        return;
      }

      if (hasRecoveryHashInUrl()) {
        clearSupabaseAuthHashFromUrl();
        await supabase.auth.signOut({ scope: "local" });
      }

      const trimmedPassword = password.trim();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: ownerEmail,
        password: trimmedPassword,
      });

      if (signInError) {
        setPassword("");
        if (signInError.message.toLowerCase().includes("invalid login credentials")) {
          setErrorMessage(
            `Incorrect password for ${maskEmail(ownerEmail)}. Passwords are case-sensitive. This is not the case study view password from the site menu.`,
          );
        } else {
          setErrorMessage(signInError.message || "Sign-in failed. Please try again.");
        }
        return;
      }

      if (data.session ?? data.user) {
        setPassword("");
        onSignIn();
        return;
      }

      setPassword("");
      setErrorMessage("Could not establish a session. Try again or check Supabase Auth settings.");
    } catch (err) {
      setPassword("");
      if (isQuotaExceededError(err)) {
        const headroom = ensureLocalStorageHeadroom();
        setErrorMessage(
          headroom.ok
            ? "Browser storage was full. Some local caches were cleared. Try signing in again."
            : `Browser storage is full (${formatStorageMegabytes(headroom.usageBytes)} used). Open ${window.location.origin}${window.location.pathname}?emergency=true to free space.`,
        );
        return;
      }
      const message = getAuthErrorMessage(err);
      if (message.toLowerCase().includes("failed to fetch")) {
        setErrorMessage(
          "Could not reach Supabase (network error). Check your connection, disable ad blockers for localhost, and confirm .env.local has valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
        );
        return;
      }
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage(null);
    setInfoMessage(null);

    if (!ownerEmail) {
      setErrorMessage(
        "Sign-in email is not configured (set VITE_SITE_OWNER_SIGNIN_EMAIL).",
      );
      return;
    }

    setSendingReset(true);
    try {
      const redirectTo = `${window.location.origin}${window.location.pathname || "/"}`;
      const { error } = await supabase.auth.resetPasswordForEmail(ownerEmail, {
        redirectTo,
      });

      if (error) {
        setErrorMessage(error.message || "Could not send reset email.");
        return;
      }

      setInfoMessage(
        `If ${maskEmail(ownerEmail)} is registered in Supabase Auth, a reset link is on its way. After clicking the link, you will see a form to set a new password on this site.`,
      );
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err));
    } finally {
      setSendingReset(false);
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
            Enter your Supabase owner password to access edit mode.
          </p>
          {ownerEmail ? (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Account: {maskEmail(ownerEmail)}
            </p>
          ) : null}
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Enter owner password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage(null);
                setInfoMessage(null);
              }}
              className={`text-center ${errorMessage ? "border-red-500 dark:border-red-500" : ""}`}
              autoFocus
              disabled={submitting}
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

          {infoMessage && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-emerald-600 dark:text-emerald-400 text-center"
            >
              {infoMessage}
            </motion.p>
          )}

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign In"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={submitting}>
              Cancel
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors disabled:opacity-50"
            onClick={() => void handleForgotPassword()}
            disabled={sendingReset || submitting}
          >
            {sendingReset ? "Sending reset email…" : "Forgot owner password? Email me a reset link"}
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Not the same as &quot;Case study view password&quot; in the site menu. Visitors browse without signing in.
        </p>
      </motion.div>
    </div>
  );
}

export default SignIn;
