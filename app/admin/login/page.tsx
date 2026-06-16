'use client';

// ─────────────────────────────────────────────────────────────
//  app/admin/login/page.tsx
// ─────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminAuthCard } from '@/components/AdminAuthCard';
import { isAdminAuthenticated } from '@/lib/auth';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (isAdminAuthenticated()) {
      router.push('/admin/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-red-950/20 to-card flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600 rounded-full blur-3xl opacity-5" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-600 rounded-full blur-3xl opacity-5" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <AdminAuthCard onSuccess={() => router.push('/admin/dashboard')} />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Not an admin?{' '}
          <Link
            href="/auth/login"
            className="font-semibold text-primary hover:underline underline-offset-4"
          >
            Go to customer login
          </Link>
        </p>
      </div>
    </div>
  );
}