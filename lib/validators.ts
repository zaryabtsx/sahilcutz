// lib/validators.ts  ← this file is still missing, create it
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
});

export const signupSchema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  password: z.string().min(6, 'At least 6 characters'),
  role: z.enum(['customer', 'barber']),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});