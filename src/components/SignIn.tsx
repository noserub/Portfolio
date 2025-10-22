import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Lock } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

interface SignInProps {
  onSignIn: (password: string) => void;
  onCancel: () => void;
}

export function SignIn({ onSignIn, onCancel }: SignInProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔐 Attempting sign-in with email: brian.bureson@gmail.com');
    
    try {
      // Try to sign in with your email and the password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'brian.bureson@gmail.com',
        password: password,
      });

      console.log('🔍 Supabase response:', { data, error });

      if (error) {
        console.log('❌ Supabase sign-in failed:', error.message);
        console.log('❌ Full error object:', error);
        setError(true);
        setPassword("");
        setTimeout(() => setError(false), 3000);
        return;
      }

      if (data.user) {
        console.log('✅ Supabase sign-in successful:', data.user.email);
        console.log('✅ User data:', data.user);
        onSignIn(password);
        setError(false);
        setPassword("");
      }
    } catch (err) {
      console.log('❌ Sign-in error:', err);
      setError(true);
      setPassword("");
      setTimeout(() => setError(false), 3000);
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
              onChange={(e) => setPassword(e.target.value)}
              className={`text-center ${error ? "border-red-500 dark:border-red-500" : ""}`}
              autoFocus
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500 text-center"
            >
              Incorrect password. Please try again.
            </motion.p>
          )}

          <div className="flex gap-3">
            <Button type="submit" className="flex-1">
              Sign In
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
            >
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
