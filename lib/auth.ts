// lib/auth.ts  ← fix this one import line
import { supabase, hasSupabaseConfig } from './supabase';  // ✅ not supabaseClient
import type { AuthSession, UserProfile, UserRole } from './types';

// ─── Constants ────────────────────────────────────────────────────────────────
const SESSION_KEY = 'sahilcutzz_session';

export const ADMIN_CREDENTIALS = {
  email: 'admin@sahilcutzz.com',
  password: 'admin123',
  role: 'admin' as UserRole,
  fullName: 'Sahil Cutzz',
};

// ─── Browser Guard ────────────────────────────────────────────────────────────
function isBrowser() {
  return typeof window !== 'undefined';
}

// ─── Session Helpers ──────────────────────────────────────────────────────────
export function getSession(): AuthSession | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function setSession(session: AuthSession): void {
  if (!isBrowser()) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(SESSION_KEY);
}

// ─── Re-hydrate custom session from Supabase ─────────────────────────────────
// Called on every page load to rebuild sahilcutzz_session from Supabase's
// own persisted session (sb-xxx-auth-token in localStorage).
async function rehydrateFromSupabase(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return false;

    const user = data.session.user;
    const meta = user.user_metadata ?? {};
    const role: UserRole =
      meta.role === 'admin'  ? 'admin'  :
      meta.role === 'barber' ? 'barber' :
      'customer';

    setSession({
      token: data.session.access_token,
      user: {
        id: user.id,
        email: user.email ?? '',
        phone: meta.phone ?? null,
        role,
        full_name: meta.fullName ?? meta.full_name ?? '',
        favorite_barber_id: null,
        created_at: user.created_at,
        updated_at: new Date().toISOString(),
      },
    });
    return true;
  } catch {
    return false;
  }
}

// ─── isAuthenticated (async) ──────────────────────────────────────────────────
export async function isAuthenticated(): Promise<boolean> {
  if (getSession()) return true;
  return rehydrateFromSupabase();
}

// ─── isAdminAuthenticated (async) ─────────────────────────────────────────────
export async function isAdminAuthenticated(): Promise<boolean> {
  const session = getSession();
  if (session?.user.role === 'admin') return true;
  if (getAdminToken() === 'admin_verified') return true;
  const ok = await rehydrateFromSupabase();
  if (ok) {
    const s = getSession();
    return s?.user.role === 'admin';
  }
  return false;
}

export function validateAdminCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === ADMIN_CREDENTIALS.email &&
    password === ADMIN_CREDENTIALS.password
  );
}

export function setAdminToken(token: string): void {
  if (isBrowser()) localStorage.setItem('adminToken', token);
}

export function getAdminToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem('adminToken');
}

export function clearAdminToken(): void {
  if (isBrowser()) localStorage.removeItem('adminToken');
}

export function adminLogout(): void {
  clearSession();
  clearAdminToken();
  supabase.auth.signOut();
}

// ─── User Sign-In ─────────────────────────────────────────────────────────────
export async function signIn(
  email: string,
  password: string,
): Promise<{ success: boolean; message: string; role?: UserRole }> {

  // 1. Supabase path
  if (hasSupabaseConfig()) {
    const response = await supabase.auth.signInWithPassword({ email, password });
    if (response.error || !response.data.session) {
      return { success: false, message: response.error?.message ?? 'Unable to sign in' };
    }

    const meta = response.data.user.user_metadata ?? {};
    const role: UserRole =
      meta.role === 'admin'  ? 'admin'  :
      meta.role === 'barber' ? 'barber' :
      'customer';

    const profile: UserProfile = {
      id: response.data.user.id,
      email,
      phone: meta.phone ?? null,
      role,
      full_name: meta.fullName ?? meta.full_name ?? '',
      favorite_barber_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setSession({ user: profile, token: response.data.session.access_token });
    return { success: true, message: 'Signed in', role };
  }

  // 2. Hardcoded admin path (no Supabase config)
  if (validateAdminCredentials(email, password)) {
    const adminSession: AuthSession = {
      token: 'admin-verified',
      user: {
        id: 'admin-1',
        email,
        phone: null,
        role: 'admin',
        full_name: ADMIN_CREDENTIALS.fullName,
        favorite_barber_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
    setSession(adminSession);
    setAdminToken('admin_verified');
    return { success: true, message: 'Signed in', role: 'admin' };
  }

  // 3. Demo customer path (dev / no Supabase config)
  if (email.endsWith('@example.com') && password.length >= 6) {
    const customerSession: AuthSession = {
      token: 'customer-session',
      user: {
        id: 'customer-1',
        email,
        phone: '+1 (555) 000-0000',
        role: 'customer',
        full_name: 'Valued Guest',
        favorite_barber_id: 'barber-sahil',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
    setSession(customerSession);
    return { success: true, message: 'Signed in', role: 'customer' };
  }

  return { success: false, message: 'Invalid email or password' };
}

// ─── User Sign-Up ─────────────────────────────────────────────────────────────
export async function signUp(payload: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}): Promise<{ success: boolean; message: string }> {

  if (hasSupabaseConfig()) {
    const response = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: { fullName: payload.fullName, phone: payload.phone, role: payload.role },
      },
    });
    if (response.error) {
      return { success: false, message: response.error.message };
    }
    setSession({
      user: {
        id: response.data.user?.id ?? 'guest',
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        full_name: payload.fullName,
        favorite_barber_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      token: response.data.session?.access_token ?? 'anonymous',
    });
    return { success: true, message: 'Account created' };
  }

  // Fallback (no Supabase config)
  const newSession: AuthSession = {
    token: 'session-' + crypto.randomUUID(),
    user: {
      id: 'customer-' + Date.now(),
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
      full_name: payload.fullName,
      favorite_barber_id: payload.role === 'customer' ? 'barber-sahil' : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
  setSession(newSession);
  return { success: true, message: 'Account created' };
}

// ─── Password Reset ───────────────────────────────────────────────────────────
export async function sendPasswordReset(
  email: string,
): Promise<{ success: boolean; message: string }> {
  if (hasSupabaseConfig()) {
    const response = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/login`,
    });
    if (response.error) {
      return { success: false, message: response.error.message };
    }
    return { success: true, message: 'Reset link sent to your email.' };
  }
  return { success: true, message: 'If that email exists, a reset link has been sent.' };
}