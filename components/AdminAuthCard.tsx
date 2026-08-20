/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ShieldAlert, Mail, Lock } from 'lucide-react';
import { loginSchema } from '@/lib/validators';
import { validateAdminCredentials, setAdminToken } from '@/lib/auth';
import type { z } from 'zod';

interface AdminAuthCardProps {
  onSuccess?: () => void;
}

export function AdminAuthCard({ onSuccess }: AdminAuthCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const handleAdminLogin = async (values: z.infer<typeof loginSchema>) => {
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const isValid = validateAdminCredentials(
        values.email,
        (values as any).password
      );

      if (!isValid) {
        setErrorMessage('Invalid admin credentials. Access denied.');
        setLoading(false);
        return;
      }

      setAdminToken('admin_verified');
      setSuccessMessage('Admin access granted! Redirecting…');
      setTimeout(() => {
        onSuccess?.();
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to authenticate');
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
          <div
            className="mx-auto mb-4 w-16 h-16 rounded-3xl flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, #ef4444, #dc2626)',
            }}
          >
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-foreground">Admin Access</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
            Secure authentication required. Authorized administrators only.
          </p>
        </div>

        <form onSubmit={handleSubmit(handleAdminLogin)} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground block mb-2"
            >
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                id="email"
                type="email"
                {...(register as any)('email')}
                placeholder=""
                className="w-full rounded-2xl border border-border bg-background/90 px-11 py-3 text-foreground outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
              />
            </div>
            {(errors as any).email && (
              <p className="text-xs text-destructive mt-2">
                {(errors as any).email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground block mb-2"
            >
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...(register as any)('password')}
                placeholder=""
                className="w-full rounded-2xl border border-border bg-background/90 px-11 py-3 text-foreground outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {(errors as any).password && (
              <p className="text-xs text-destructive mt-2">
                {(errors as any).password.message}
              </p>
            )}
          </div>

          {successMessage && (
            <div className="rounded-2xl bg-success/10 border border-success/20 p-4 text-sm text-success">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            type="submit"
            className="w-full rounded-2xl px-6 py-3.5 text-sm font-bold text-white shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: loading
                ? '#9ca3af'
                : 'linear-gradient(135deg, #ef4444, #dc2626)',
            }}
          >
            {loading ? 'Authenticating…' : 'Access Admin Panel'}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          ⚠️ Unauthorized access attempts are logged and monitored.
        </p>
      </div>
    </motion.div>
  );
}
