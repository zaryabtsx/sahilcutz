'use client';

import { useRouter } from 'next/navigation';
import { AuthCard } from './AuthCard';

export function ForgotPasswordForm() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/auth/login');
  };

  return (
    <AuthCard
      mode="forgot"
      onSuccess={handleSuccess}
    />
  );
}
          className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/20 disabled:opacity-50"
        >
          {loading ? 'Sending link…' : 'Send reset link'}
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </form>
    </AuthCard>
  );
}
