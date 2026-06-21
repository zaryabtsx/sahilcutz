// app/auth/reset-password/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email || !password) return setError('Both fields are required.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    setError('');

    const res = await fetch('/api/admin-reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        secret: process.env.NEXT_PUBLIC_ADMIN_RESET_SECRET,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) return setError(data.error ?? 'Something went wrong.');

    setMessage('Your password has been changed successfully!');
    setTimeout(() => router.push('/auth/login'), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 rounded-3xl flex items-center justify-center bg-gradient-to-br from-primary to-accent">
            <ShieldCheck className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-black text-foreground">Reset Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and new password to reset.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full rounded-2xl border border-border bg-background/90 px-11 py-3 text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-2xl border border-border bg-background/90 px-11 py-3 text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-600">
              {message}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-primary-foreground shadow-xl disabled:opacity-50"
          >
            {loading ? 'Changing password…' : 'Change Password'}
            <ArrowRight className="w-4 h-4" />
          </motion.button>

          <p className="text-center text-sm text-muted-foreground">
            Back to{' '}
            <a href="/auth/login" className="text-primary hover:underline">Sign in</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}