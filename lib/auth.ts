// lib/auth.ts
import { supabase, hasSupabaseConfig } from './supabase';
import type { AuthSession, UserProfile, UserRole } from './types';
import Cookies from 'js-cookie';   // ← Added for better persistence

// ─── Constants ────────────────────────────────────────────────────────────────
const SESSION_KEY = 'sahilcutzz_session';
const ADMIN_TOKEN_COOKIE = 'admin_token';

export const ADMIN_CREDENTIALS = {
  email: 'admin@sahilcutzz.com',
  password: 'admin123',
  role: 'admin' as UserRole,
  fullName: 'Sahil Cutz',
};

// ─── Browser Guard ────────────────────────────────────────────────────────────
function isBrowser() {
  return typeof window !== 'undefined';
}

// ─── Cookie Options ───────────────────────────────────────────────────────────
const COOKIE_OPTIONS = { expires: 7, path: '/' }; // 7 days

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

// ─── Admin Token Helpers (Improved with Cookies) ─────────────────────────────
export function setAdminToken(token: string): void {
  if (!isBrowser()) return;
  localStorage.setItem('adminToken', token);
  Cookies.set(ADMIN_TOKEN_COOKIE, token, COOKIE_OPTIONS);
}

export function getAdminToken(): string | null {
  if (!isBrowser()) return null;

  // Prefer cookie (more reliable across browsers/profiles)
  const cookieToken = Cookies.get(ADMIN_TOKEN_COOKIE);
  if (cookieToken) return cookieToken;

  return localStorage.getItem('adminToken');
}

export function clearAdminToken(): void {
  if (!isBrowser()) return;
  localStorage.removeItem('adminToken');
  Cookies.remove(ADMIN_TOKEN_COOKIE);
}

// ─── Re-hydrate custom session from Supabase ─────────────────────────────────
async function rehydrateFromSupabase(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      clearSession();
      return false;
    }

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
    clearSession();
    return false;
  }
}

// ─── isAuthenticated (async) ──────────────────────────────────────────────────
export async function isAuthenticated(): Promise<boolean> {
  if (!getSession()) {
    return rehydrateFromSupabase();
  }

  const ok = await rehydrateFromSupabase();
  return ok;
}

// ─── isAdminAuthenticated (async) ─────────────────────────────────────────────
export async function isAdminAuthenticated(): Promise<boolean> {
  const session = getSession();
  if (session?.user.role === 'admin') {
    const ok = await rehydrateFromSupabase();
    return ok && getSession()?.user.role === 'admin';
  }

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

export function adminLogout(): void {
  clearSession();
  clearAdminToken();
  supabase.auth.signOut();
}

async function syncProfileFromAuth(profile: UserProfile): Promise<void> {
  if (!hasSupabaseConfig() || !profile.id || profile.id === 'guest') return;

  try {
    await supabase.from('profiles').upsert({
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
    }, { onConflict: 'id' });
  } catch {
    // Profile sync should not block auth.
  }
}

async function sendWelcomeEmail(email: string, fullName: string): Promise<void> {
  if (!isBrowser()) return;

  try {
    await fetch('/api/auth/welcome-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName }),
    });
  } catch (error) {
    console.warn('Welcome email request failed:', error);
  }
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

    await syncProfileFromAuth(profile);
    setSession({ user: profile, token: response.data.session.access_token });
    return { success: true, message: 'Signed in', role };
  }

  // 2. Hardcoded admin path (no Supabase config)
 // Inside signIn function, in the hardcoded admin block:
if (validateAdminCredentials(email, password)) {
  // ... existing code ...

  // ADD THIS:
  if (hasSupabaseConfig()) {
    await supabase.auth.signInWithPassword({
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password,
    });
  }

  // rest of your code...
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
    const profile: UserProfile = {
      id: response.data.user?.id ?? 'guest',
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
      full_name: payload.fullName,
      favorite_barber_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await syncProfileFromAuth(profile);
    await sendWelcomeEmail(payload.email, payload.fullName);
    setSession({
      user: profile,
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
  await sendWelcomeEmail(payload.email, payload.fullName);
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
