'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signUp } from '@/lib/auth';
import { AuthCard } from './AuthCard';
import { ArrowRight, User, Mail, Phone, Lock, AlertCircle } from 'lucide-react';

const registrationSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegistrationValues = z.infer<typeof registrationSchema>;

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationValues>({ resolver: zodResolver(registrationSchema) });

  const onSubmit = async (values: RegistrationValues) => {
    setLoading(true);
    setError('');

    try {
      const result = await signUp({
        ...values,
        role: 'customer',
      });
      if (result.success) {
        router.push('/customer/dashboard');
      } else {
        setError(result.message);
      }
    } catch {
      setError('Unable to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create your Sahil Cutz account"
      description="Start managing appointments, barbers, and premium bookings with a luxury dashboard."
      footer={<p>Already have an account? <a href="/auth/login" className="text-primary hover:text-accent">Sign in</a></p>}
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
          Full name
          <div className="mt-2 rounded-3xl border border-border bg-card px-4 py-3 flex items-center gap-3">
            <User className="w-4 h-4 text-muted-foreground" />
            <input
              {...register('fullName')}
              type="text"
              className="w-full bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
              placeholder="Sahil Kapoor"
              disabled={loading}
            />
          </div>
          {errors.fullName && <p className="mt-2 text-xs text-destructive">{errors.fullName.message}</p>}
        </label>

        <label className="block text-sm text-foreground">
          Email
          <div className="mt-2 rounded-3xl border border-border bg-card px-4 py-3 flex items-center gap-3">
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
          Phone number
          <div className="mt-2 rounded-3xl border border-border bg-card px-4 py-3 flex items-center gap-3">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <input
              {...register('phone')}
              type="tel"
              className="w-full bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
              placeholder="+1 (555) 123-4567"
              disabled={loading}
            />
          </div>
          {errors.phone && <p className="mt-2 text-xs text-destructive">{errors.phone.message}</p>}
        </label>

        <label className="block text-sm text-foreground">
          Password
          <div className="mt-2 rounded-3xl border border-border bg-card px-4 py-3 flex items-center gap-3">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <input
              {...register('password')}
              type="password"
              className="w-full bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
              placeholder="Create password"
              disabled={loading}
            />
          </div>
          {errors.password && <p className="mt-2 text-xs text-destructive">{errors.password.message}</p>}
        </label>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-3xl bg-linear-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/20 disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create account'}
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </form>
    </AuthCard>
  );
}
