import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AuthTest() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      setMessage('Check your email for the confirmation link!');
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      setMessage('Signed in successfully!');
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMessage('Signed out successfully!');
  };

  if (user) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Authentication Test</h1>
        
        <div className="bg-green-100 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-2">✅ Authenticated</h2>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>User ID:</strong> {user.id}</p>
        </div>

        <button
          onClick={handleSignOut}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Sign Out
        </button>

        {message && (
          <div className="mt-4 p-2 bg-white rounded border">
            {message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Authentication Test</h1>
      
      <div className="bg-yellow-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">⚠️ Not Authenticated</h2>
        <p>You need to sign in to migrate data to Supabase.</p>
      </div>

      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          
          <button
            type="button"
            onClick={handleSignUp}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Quick Test Setup</h3>
          <p className="text-yellow-700 text-sm mb-3">
            For testing, you can use any email/password combination. 
            Make sure to disable email confirmation in your Supabase dashboard first.
          </p>
          <div className="text-sm text-yellow-600">
            <p><strong>Test credentials:</strong></p>
            <p>Email: test@example.com</p>
            <p>Password: password123</p>
          </div>
        </div>
      </form>

      {message && (
        <div className="mt-4 p-2 bg-white rounded border">
          {message}
        </div>
      )}
    </div>
  );
}
