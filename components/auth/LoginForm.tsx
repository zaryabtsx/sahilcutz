'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from '@/lib/auth';
import { AuthCard } from './AuthCard';
import { ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    setLoading(true);
    setError('');

    try {
      const result = await signIn(values.email, values.password);
      if (result.success) {
        router.push(result.role === 'barber' ? '/barber/dashboard' : result.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard');
      } else {
        setError(result.message);
      }
    } catch {
      setError('Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Sign in to Sahil Cutzz"
      description="Access the premium barber management SaaS with fast role-aware login."
      footer={<p>New to Sahil Cutzz? <a href="/auth/signup" className="text-primary hover:text-accent">Create an account</a></p>}
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <label className="block text-sm text-foreground">
          Email
          <div className="mt-2 flex items-center gap-3 rounded-3xl border border-border bg-card px-4 py-3">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <input
              {...register('email')}
              type="email"
              className="w-full bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
              placeholder="you@domain.com"
              disabled={loading}
            />
          </div>
          {errors.email && <p className="mt-2 text-xs text-destructive">{errors.email.message}</p>}
        </label>

        <label className="block text-sm text-foreground">
          Password
          <div className="mt-2 flex items-center gap-3 rounded-3xl border border-border bg-card px-4 py-3">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <input
              {...register('password')}
              type="password"
              className="w-full bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>
          {errors.password && <p className="mt-2 text-xs text-destructive">{errors.password.message}</p>}
        </label>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Role-aware dashboard access</span>
          <a href="/auth/forgot-password" className="text-primary hover:text-accent">Forgot password?</a>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/20 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </form>
    </AuthCard>
  );
}
