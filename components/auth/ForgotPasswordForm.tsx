// components/ForgotPasswordForm.tsx
'use client';

import { useRouter } from 'next/navigation';
import { AuthCard } from './AuthCard';

export function ForgotPasswordForm() {
  const router = useRouter();
  return (
    <AuthCard
      mode="forgot"
      onSuccess={() => router.push('/auth/login')}
    />
  );
}