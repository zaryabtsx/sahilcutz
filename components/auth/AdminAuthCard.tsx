'use client';

// ─────────────────────────────────────────────────────────────
//  components/AdminAuthCard.tsx
//  Hardcoded-admin login card
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ShieldAlert, Loader2 } from 'lucide-react';
import { signIn } from '@/lib/auth';

interface AdminAuthCardProps {
  onSuccess: () => void;
}

export function AdminAuthCard({ onSuccess }: AdminAuthCardProps) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    // Small artificial delay so the UI doesn't flash
    await new Promise((r) => setTimeout(r, 600));

    const result = await signIn(email, password);
    setLoading(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.message || 'Invalid admin credentials. Access denied.');
    }
  };

  return (
    <div className="rounded-[32px] border border-red-900/40 bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center mb-8">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-600/15 border border-red-600/30">
          <ShieldAlert className="w-7 h-7 text-red-500" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-red-500 font-semibold">Restricted Access</p>
          <h1 className="mt-1 text-3xl font-black text-foreground">Admin Login</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sahil Cutzz Command Center</p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-5 rounded-2xl border border-red-700/40 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Admin Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sahilcutzz.com"
              className="w-full rounded-2xl border border-border bg-background/80 pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/60 transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-2xl border border-border bg-background/80 pl-11 pr-12 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/60 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full flex items-center justify-center gap-2 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-900/30 transition-all duration-200"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying…
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4" />
              Access Admin Panel
            </>
          )}
        </button>
      </form>

      {/* Footer note */}
      <p className="mt-6 text-center text-xs text-muted-foreground/60">
        This portal is for authorised administrators only.
        <br />
        Unauthorised access attempts are logged.
      </p>
    </div>
  );
}