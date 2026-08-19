'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ShieldCheck, Mail, User, Lock } from 'lucide-react';
import Link from 'next/link';
import { loginSchema, signupSchema, forgotPasswordSchema } from '@/lib/validators';
import { signIn, signUp, sendPasswordReset } from '@/lib/auth';
import type { z } from 'zod';

type AuthFormValues = {
  email: string;
  password?: string;
  full_name?: string;
  phone?: string;
};

interface AuthCardProps {
  mode: 'login' | 'signup' | 'forgot';
  onSuccess?: () => void;
}

const formConfig = {
  login: {
    title: 'Sign In',
    subtitle: 'Access your booking dashboard and manage appointments seamlessly.',
    button: 'Continue to Dashboard',
  },
  signup: {
    title: 'Create Account',
    subtitle: 'Join Sahil Cutz for premium barber booking and customer perks.',
    button: 'Create Account',
  },
  forgot: {
    title: 'Recover Password',
    subtitle: 'Send a reset link to your email and regain access immediately.',
    button: 'Send Reset Link',
  },
};

export function AuthCard({ mode, onSuccess }: AuthCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const schema = mode === 'signup' ? signupSchema : mode === 'forgot' ? forgotPasswordSchema : loginSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormValues>({ resolver: zodResolver(schema) as Resolver<AuthFormValues> });

  const handleForm = async (values: AuthFormValues) => {
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const loginValues = values as z.infer<typeof loginSchema>;
        const result = await signIn(loginValues.email, loginValues.password ?? '');

        if (!result.success) {
          throw new Error(result.message);
        }

        setSuccessMessage('Welcome back! Redirecting…');
        onSuccess?.();
      }

      if (mode === 'signup') {
        const signupValues = values as z.infer<typeof signupSchema>;
        const result = await signUp({
          fullName: signupValues.full_name,
          email: signupValues.email,
          phone: signupValues.phone,
          password: signupValues.password,
          role: 'customer',
        });

        if (!result.success) {
          throw new Error(result.message);
        }

        setSuccessMessage('Account created successfully. Redirecting…');
        onSuccess?.();
        return;
      }

      if (mode === 'forgot') {
        const result = await sendPasswordReset(values.email);
        if (!result.success) {
          throw new Error(result.message);
        }
        setSuccessMessage('Password recovery link sent. Please check your email for instructions.');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to complete request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md"
    >
      <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-3xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
            <ShieldCheck className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-black text-foreground">{formConfig[mode].title}</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">{formConfig[mode].subtitle}</p>
        </div>

        <form onSubmit={handleSubmit(handleForm)} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="full_name" className="text-sm font-medium text-foreground block mb-2">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  id="full_name"
                  type="text"
                  {...register('full_name')}
                  className="w-full rounded-2xl border border-border bg-background/90 px-11 py-3 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
              </div>
              {errors.full_name && <p className="text-xs text-destructive mt-2">{errors.full_name.message}</p>}
            </div>
          )}

          <div>
            <label htmlFor="email" className="text-sm font-medium text-foreground block mb-2">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full rounded-2xl border border-border bg-background/90 px-11 py-3 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>
            {errors.email && <p className="text-xs text-destructive mt-2">{errors.email.message}</p>}
          </div>

          {mode !== 'forgot' && (
            <div>
              <label htmlFor="password" className="text-sm font-medium text-foreground block mb-2">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="w-full rounded-2xl border border-border bg-background/90 px-11 py-3 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-2">{errors.password.message}</p>}
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label htmlFor="phone" className="text-sm font-medium text-foreground block mb-2">Phone Number</label>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                className="w-full rounded-2xl border border-border bg-background/90 px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
              {errors.phone && <p className="text-xs text-destructive mt-2">{errors.phone.message}</p>}
            </div>
          )}

          {successMessage && <div className="rounded-2xl bg-success/10 border border-success/20 p-4 text-sm text-success">{successMessage}</div>}
          {errorMessage && <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">{errorMessage}</div>}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl px-5 py-3.5 bg-linear-to-r from-primary to-accent text-primary-foreground font-semibold shadow-xl shadow-primary/20"
          >
            {loading ? 'Working…' : formConfig[mode].button}
          </motion.button>

          {mode === 'signup' && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-primary hover:underline underline-offset-4">
                Sign in
              </Link>
            </div>
          )}
        </form>
      </div>
    </motion.div>
  );
}
