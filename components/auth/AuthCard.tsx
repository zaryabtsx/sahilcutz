'use client';

// ─────────────────────────────────────────────────────────────
//  components/AuthCard.tsx
//  Customer / barber auth card  –  backed by Supabase
//  Modes: login | signup | forgot
// ─────────────────────────────────────────────────────────────

import { useState, type ReactNode } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { signIn, signUp, sendPasswordReset } from '@/lib/auth';

type Mode = 'login' | 'signup' | 'forgot';

interface ModeAuthCardProps {
  mode: Mode;
  onSuccess: () => void;
}

interface LayoutAuthCardProps {
  title: string;
  description: string;
  footer?: ReactNode;
  children: ReactNode;
}

type AuthCardProps = ModeAuthCardProps | LayoutAuthCardProps;

// ── tiny helper ──────────────────────────────────────────────
function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  icon: Icon,
  rightSlot,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon: React.ElementType;
  rightSlot?: React.ReactNode;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type={type}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-border bg-background/80 pl-11 pr-12 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
        />
        {rightSlot && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2">{rightSlot}</span>
        )}
      </div>
    </div>
  );
}

export function AuthCard(props: AuthCardProps) {
  if ('children' in props) {
    const { title, description, footer, children } = props;

    return (
      <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-primary font-semibold">
            Sahil Cutzz
          </p>
          <h1 className="mt-2 text-3xl font-black text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="space-y-6">{children}</div>

        {footer && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    );
  }

  return <ModeAuthCard {...props} />;
}

function ModeAuthCard({ mode, onSuccess }: ModeAuthCardProps) {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [showCf, setShowCf]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [sent, setSent]         = useState(false);   // for forgot mode

  const eyeBtn = (show: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      className="text-muted-foreground hover:text-foreground transition-colors"
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  const validate = () => {
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    if (mode === 'forgot') return null;
    if (!password) return 'Password is required.';
    if (mode === 'signup') {
      if (!name.trim()) return 'Full name is required.';
      if (password.length < 8) return 'Password must be at least 8 characters.';
      if (password !== confirm) return 'Passwords do not match.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      if (mode === 'login') {
        const result = await signIn(email, password);
        if (!result.success) {
          setError(result.message);
          return;
        }
        onSuccess();
      } else if (mode === 'signup') {
        const result = await signUp({
          fullName: name.trim(),
          email,
          password,
          phone: '',
          role: 'customer',
        });
        if (!result.success) {
          setError(result.message);
          return;
        }
        onSuccess();
      } else {
        const result = await sendPasswordReset(email);
        if (!result.success) {
          setError(result.message);
          return;
        }
        setSent(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot – success state ───────────────────────────────
  if (mode === 'forgot' && sent) {
    return (
      <div className="rounded-[32px] border border-border bg-card/90 p-10 shadow-2xl backdrop-blur-xl text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle2 className="w-14 h-14 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-foreground">Check your inbox</h2>
        <p className="text-sm text-muted-foreground">
          We sent a password-reset link to <span className="text-foreground font-semibold">{email}</span>.
          <br />
          It may take a minute to arrive.
        </p>
        <Link
          href="/auth/login"
          className="inline-block mt-2 text-sm font-semibold text-primary hover:underline underline-offset-4"
        >
          Back to login
        </Link>
      </div>
    );
  }

  // ── Titles per mode ──────────────────────────────────────
  const titles: Record<Mode, { heading: string; sub: string }> = {
    login:  { heading: 'Welcome back',      sub: 'Sign in to your account'                     },
    signup: { heading: 'Create an account', sub: 'Join Sahil Cutzz and book appointments'       },
    forgot: { heading: 'Forgot password?',  sub: "We'll send you a reset link right away"       },
  };

  const { heading, sub } = titles[mode];

  return (
    <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-xs uppercase tracking-[0.35em] text-primary font-semibold">
          {mode === 'forgot' ? 'Password Reset' : mode === 'signup' ? 'New Account' : 'Customer Portal'}
        </p>
        <h1 className="mt-2 text-3xl font-black text-foreground">{heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Name – signup only */}
        {mode === 'signup' && (
          <Field
            label="Full Name"
            type="text"
            value={name}
            onChange={setName}
            placeholder="John Doe"
            icon={User}
            autoComplete="name"
          />
        )}

        {/* Email */}
        <Field
          label="Email Address"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          icon={Mail}
          autoComplete="email"
        />

        {/* Password */}
        {mode !== 'forgot' && (
          <Field
            label="Password"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={setPassword}
            placeholder="••••••••••••"
            icon={Lock}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            rightSlot={eyeBtn(showPw, () => setShowPw((v) => !v))}
          />
        )}

        {/* Confirm password – signup only */}
        {mode === 'signup' && (
          <Field
            label="Confirm Password"
            type={showCf ? 'text' : 'password'}
            value={confirm}
            onChange={setConfirm}
            placeholder="••••••••••••"
            icon={Lock}
            autoComplete="new-password"
            rightSlot={eyeBtn(showCf, () => setShowCf((v) => !v))}
          />
        )}

        {/* Forgot password link – login only */}
        {mode === 'login' && (
          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {mode === 'login' ? 'Signing in…' : mode === 'signup' ? 'Creating account…' : 'Sending link…'}
            </>
          ) : (
            <>
              {mode === 'login'  && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot' && 'Send Reset Link'}
            </>
          )}
        </button>
      </form>

      {/* Footer links */}
      <div className="mt-6 text-center text-sm text-muted-foreground space-y-2">
        {mode === 'login' && (
          <p>
            Don&#39;t have an account?{' '}
            <Link href="/auth/signup" className="font-semibold text-primary hover:underline underline-offset-4">
              Sign up
            </Link>
          </p>
        )}
        {mode === 'signup' && (
          <p>
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-primary hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        )}
        {mode === 'forgot' && (
          <p>
            Remembered it?{' '}
            <Link href="/auth/login" className="font-semibold text-primary hover:underline underline-offset-4">
              Back to login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
