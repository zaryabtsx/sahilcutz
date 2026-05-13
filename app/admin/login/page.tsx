'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLoginForm } from '@/components/AdminLoginForm';
import { isAdminAuthenticated } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (isAdminAuthenticated()) {
      router.push('/admin/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center px-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl opacity-5" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent rounded-full blur-3xl opacity-5" />
      </div>

      {/* Login form */}
      <div className="relative z-10">
        <AdminLoginForm />
      </div>
    </div>
  );
}
