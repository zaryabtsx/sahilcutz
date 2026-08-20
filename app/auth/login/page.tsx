'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthCard } from '@/components/AuthCard';
import { getSession, isAuthenticated } from '@/lib/auth';
import { supabase } from '@/lib/supabase';  // ✅ fixed
import Link from 'next/link';

function redirectByRole(role: string, router: ReturnType<typeof useRouter>) {
  if (role === 'admin')  { router.push('/admin/dashboard');    return; }
  if (role === 'barber') { router.push('/barber/dashboard');   return; }
                           router.push('/customer/dashboard');
}

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    isAuthenticated().then((ok) => {
      if (!ok) return;
      const session = getSession();
      if (session) redirectByRole(session.user.role, router);
    });
  }, [router]);

  const handleSuccess = async () => {
    const session = getSession();
    if (session?.user.role) {
      redirectByRole(session.user.role, router);
      return;
    }

    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const meta = data.session.user.user_metadata ?? {};
      redirectByRole(meta.role ?? 'customer', router);
      return;
    }

    router.push('/customer/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-foreground mb-2">Customer Login</h1>
          <p className="text-muted-foreground">Sign in and book your next appointment</p>
        </div>

        <AuthCard mode="login" onSuccess={handleSuccess} />

        <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
          <p>
            Don&lsquo;t have an account?{' '}
            <Link href="/auth/signup" className="font-semibold text-primary hover:underline underline-offset-4">
              Create one
            </Link>
          </p>
          <p>
            <Link href="/auth/reset-password" className="font-semibold text-primary hover:underline underline-offset-4">
              Forgot password?
            </Link>
          </p>
          {/* <p>
            Admin?{' '}
            <Link href="/admin/login" className="font-semibold text-red-600 hover:text-red-500 underline-offset-4 hover:underline">
              Go to admin panel
            </Link>
          </p> */}
        </div>
      </div>
    </div>
  );
}