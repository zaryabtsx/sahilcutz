'use client';

// ─────────────────────────────────────────────────────────────
//  app/auth/signup/page.tsx
// ─────────────────────────────────────────────────────────────

import { useRouter } from 'next/navigation';
import { AuthCard } from '@/components/AuthCard';

export default function SignupPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-16 right-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-20 left-1/4 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <AuthCard mode="signup" />
      </div>
    </div>
  );
}