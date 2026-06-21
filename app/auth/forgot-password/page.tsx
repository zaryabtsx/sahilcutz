// app/auth/forgot-password/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/auth/reset-password'); }, [router]);
  return null;
}