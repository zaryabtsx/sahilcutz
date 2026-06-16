'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import {
  CalendarCheck,
  Clock,
  Bell,
  ArrowRight,
  Scissors,
  CheckCircle2,
  XCircle,
  LogOut,
  Edit3,
  Loader2,
  Award,
  TrendingUp,
  Star,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ChevronRight,
  Shield,
  RefreshCw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppointmentRow {
  id: string;
  service_id: string;
  barber_id: string;
  start_at: string;
  end_at: string;
  duration_minutes: number;
  status: 'confirmed' | 'completed' | 'cancelled' | 'pending';
  is_emergency: boolean;
  services?: { name: string; price: number };
  barbers?: { name: string };
}

interface ProfileMeta {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  preferred_barber: string | null;
  preferred_service: string | null;
  loyalty_points: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  notifications_enabled: boolean;
  notification_method: string;
  total_visits: number;
  total_spend: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  if (name) return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  if (email) return email[0].toUpperCase();
  return 'U';
}

const TIER_COLORS: Record<ProfileMeta['tier'], { bg: string; text: string; border: string }> = {
  Bronze:   { bg: 'bg-amber-900/30',  text: 'text-amber-500',  border: 'border-amber-700/40' },
  Silver:   { bg: 'bg-slate-700/40',  text: 'text-slate-300',  border: 'border-slate-500/40' },
  Gold:     { bg: 'bg-yellow-900/30', text: 'text-yellow-400', border: 'border-yellow-600/40' },
  Platinum: { bg: 'bg-cyan-900/30',   text: 'text-cyan-300',   border: 'border-cyan-500/40'  },
};

const STATUS_CONFIG = {
  confirmed: { icon: <Clock className="w-3 h-3" />,        label: 'Confirmed',  cls: 'bg-blue-900/30 text-blue-400 border-blue-700/40' },
  completed: { icon: <CheckCircle2 className="w-3 h-3" />, label: 'Completed',  cls: 'bg-green-900/30 text-green-400 border-green-700/40' },
  cancelled: { icon: <XCircle className="w-3 h-3" />,      label: 'Cancelled',  cls: 'bg-red-900/30 text-red-400 border-red-700/40' },
  pending:   { icon: <Clock className="w-3 h-3" />,        label: 'Pending',    cls: 'bg-yellow-900/30 text-yellow-400 border-yellow-700/40' },
};

const TABS = ['Overview', 'Appointments', 'Settings'] as const;
type Tab = typeof TABS[number];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, delay = 0 }: { icon: React.ReactNode; label: string; value: string; sub?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="rounded-2xl border border-white/[0.06] bg-[#111109] p-5"
    >
      <div className="mb-3 inline-flex rounded-xl bg-[#C9A84C]/10 p-2.5 text-[#C9A84C]">{icon}</div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5C5A50]">{label}</p>
      <p className="mt-1 font-['Playfair_Display'] text-2xl font-bold text-[#F0EDE4]">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-[#5C5A50]">{sub}</p>}
    </motion.div>
  );
}

function ApptCard({ appt, delay = 0 }: { appt: AppointmentRow; delay?: number }) {
  const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.pending;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay }}
      className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#111109] p-4 transition-colors hover:border-[#C9A84C]/20 hover:bg-[#1A1A14]"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#C9A84C]/10 text-[#C9A84C]">
        <Scissors className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#F0EDE4]">{appt.services?.name ?? 'Service'}</p>
        <p className="mt-0.5 text-xs text-[#5C5A50]">
          {appt.barbers?.name ?? 'Barber'} · {formatDate(appt.start_at)} · {formatTime(appt.start_at)}
        </p>
      </div>
      <div className="hidden flex-col items-end gap-1.5 sm:flex">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${cfg.cls}`}>
          {cfg.icon}{cfg.label}
        </span>
        {appt.services?.price != null && (
          <p className="text-xs font-semibold text-[#9A9585]">${appt.services.price}</p>
        )}
      </div>
    </motion.div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${on ? 'bg-[#C9A84C]' : 'bg-[#2C2C24]'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-[#0A0A08] shadow transition-all duration-300 ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[#1A1A14] ${className}`} />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();

  // Auth state
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);

  // Profile data from `profiles` table
  const [profile, setProfile] = useState<ProfileMeta | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [apptLoading, setApptLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Overview');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);

  // Edit form
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // ── Auth & profile fetch ──────────────────────────────────────────────────

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/auth/login');
        return;
      }
      setSession(data.session);
      setAuthUser(data.session.user);
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!s) { router.push('/auth/login'); return; }
      setSession(s);
      setAuthUser(s.user);
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  // Fetch profile once we have the user id
  useEffect(() => {
    if (!authUser) return;
    fetchProfile(authUser);
    fetchAppointments(authUser.id);
  }, [authUser]);

  async function fetchProfile(user: User) {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      // Build a minimal profile from auth metadata if none exists
      const meta = user.user_metadata ?? {};
      setProfile({
        id: user.id,
        full_name: meta.full_name ?? null,
        phone: meta.phone ?? null,
        avatar_url: meta.avatar_url ?? null,
        preferred_barber: null,
        preferred_service: null,
        loyalty_points: 0,
        tier: 'Bronze',
        notifications_enabled: true,
        notification_method: 'Email & SMS',
        total_visits: 0,
        total_spend: 0,
      });
    } else {
      setProfile(data as ProfileMeta);
      setNotifEnabled(data.notifications_enabled ?? true);
    }

    setEditName(data?.full_name ?? user.user_metadata?.full_name ?? '');
    setEditPhone(data?.phone ?? user.user_metadata?.phone ?? '');
    setLoading(false);
  }

  async function fetchAppointments(userId: string) {
    setApptLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('*, services(name, price), barbers(name)')
      .eq('user_id', userId)
      .order('start_at', { ascending: false })
      .limit(20);

    if (!error && data) setAppointments(data as AppointmentRow[]);
    setApptLoading(false);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!authUser) return;
    setSaving(true);
    await supabase.from('profiles').upsert({
      id: authUser.id,
      full_name: editName,
      phone: editPhone,
      updated_at: new Date().toISOString(),
    });
    setProfile((p) => p ? { ...p, full_name: editName, phone: editPhone } : p);
    setSaving(false);
    setEditing(false);
  }

  async function handleToggleNotifications() {
    if (!authUser) return;
    const next = !notifEnabled;
    setNotifEnabled(next);
    await supabase.from('profiles').upsert({
      id: authUser.id,
      notifications_enabled: next,
      updated_at: new Date().toISOString(),
    });
    setProfile((p) => p ? { ...p, notifications_enabled: next } : p);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const displayName  = profile?.full_name || authUser?.user_metadata?.full_name || authUser?.email;
  const displayEmail = authUser?.email ?? '—';
  const displayPhone = profile?.phone || authUser?.user_metadata?.phone || 'Not added';
  const initials     = getInitials(displayName, authUser?.email);
  const tier         = profile?.tier ?? 'Bronze';
  const tierStyle    = TIER_COLORS[tier];
  const loyaltyPct   = Math.min(((profile?.loyalty_points ?? 0) / 1000) * 100, 100);

  const upcoming = appointments.filter((a) => a.status === 'confirmed' || a.status === 'pending');
  const past     = appointments.filter((a) => a.status === 'completed' || a.status === 'cancelled');

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen bg-[#0A0A08] font-['DM_Sans',system-ui,sans-serif]"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E\")" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">

        {/* ── Topbar ── */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-10 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#C9A84C] to-[#E5C97A] font-['Playfair_Display'] text-lg font-black text-[#0A0A08]">S</div>
            <div>
              <p className="font-['Playfair_Display'] text-base font-bold text-[#F0EDE4]">Sahil Cutzz</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#C9A84C]">Premium Barbershop</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { if (authUser) { fetchProfile(authUser); fetchAppointments(authUser.id); } }}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#111109] px-3 py-2 text-xs font-semibold text-[#9A9585] transition-colors hover:text-[#C9A84C]"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#111109] px-4 py-2 text-xs font-semibold text-[#9A9585] transition-colors hover:border-red-800/40 hover:text-red-400 disabled:opacity-50"
            >
              {signingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
              Sign out
            </button>
          </div>
        </motion.div>

        {/* ── Hero Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="relative mb-8 overflow-hidden rounded-3xl border border-white/[0.06] bg-[#111109]"
        >
          <div className="pointer-events-none absolute -top-20 left-1/3 h-56 w-56 rounded-full bg-[#C9A84C]/6 blur-3xl" />

          <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:p-8">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {loading ? (
                <Skeleton className="h-24 w-24 rounded-2xl sm:h-28 sm:w-28" />
              ) : profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName ?? ''} className="h-24 w-24 rounded-2xl object-cover ring-2 ring-[#C9A84C]/30 sm:h-28 sm:w-28" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 ring-2 ring-[#C9A84C]/30 sm:h-28 sm:w-28">
                  <span className="font-['Playfair_Display'] text-3xl font-black text-[#C9A84C]">{initials}</span>
                </div>
              )}
              <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#C9A84C] text-[10px] font-black text-[#0A0A08]">✦</span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0">
                  {loading ? (
                    <>
                      <Skeleton className="mb-2 h-8 w-48" />
                      <Skeleton className="h-4 w-72" />
                    </>
                  ) : (
                    <>
                      <h1 className="font-['Playfair_Display'] text-3xl font-black text-[#F0EDE4]">{displayName}</h1>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5C5A50]">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{displayEmail}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{displayPhone}</span>
                      </div>
                    </>
                  )}
                </div>
                {!loading && (
                  <span className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}>
                    <Award className="w-3 h-3" />{tier} Member
                  </span>
                )}
              </div>

              {/* Loyalty bar */}
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#9A9585]">Loyalty points</span>
                  <span className="font-bold text-[#C9A84C]">{profile?.loyalty_points ?? 0} / 1,000</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#1A1A14]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${loyaltyPct}%` }}
                    transition={{ duration: 1.1, delay: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E5C97A]"
                  />
                </div>
                <p className="mt-1.5 text-xs text-[#5C5A50]">{1000 - (profile?.loyalty_points ?? 0)} points until Platinum</p>
              </div>
            </div>
          </div>

          {/* Meta strip */}
          <div className="border-t border-white/[0.06] px-8 py-3">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#5C5A50]">
              <span>Total visits: <strong className="text-[#9A9585]">{profile?.total_visits ?? 0}</strong></span>
              <span>Total spend: <strong className="text-[#9A9585]">${profile?.total_spend ?? 0}</strong></span>
              {profile?.preferred_barber && <span>Preferred barber: <strong className="text-[#9A9585]">{profile.preferred_barber}</strong></span>}
              {profile?.preferred_service && <span>Favourite service: <strong className="text-[#9A9585]">{profile.preferred_service}</strong></span>}
            </div>
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22 }}
          className="mb-8 flex gap-1 rounded-2xl border border-white/[0.06] bg-[#111109] p-1.5"
        >
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${tab === t ? 'text-[#0A0A08]' : 'text-[#5C5A50] hover:text-[#9A9585]'}`}
            >
              {tab === t && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#E5C97A]"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative">{t}</span>
            </button>
          ))}
        </motion.div>

        {/* ── Content ── */}
        <AnimatePresence mode="wait">

          {/* Overview */}
          {tab === 'Overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard icon={<CalendarCheck className="w-4 h-4" />}  label="Total visits"  value={loading ? '—' : String(profile?.total_visits ?? 0)}   sub="all time"  delay={0}    />
                <StatCard icon={<TrendingUp className="w-4 h-4" />}      label="Total spend"   value={loading ? '—' : `$${profile?.total_spend ?? 0}`}        sub="lifetime" delay={0.05} />
                <StatCard icon={<Star className="w-4 h-4" />}            label="Loyalty pts"   value={loading ? '—' : String(profile?.loyalty_points ?? 0)}   sub="redeemable" delay={0.1}  />
                <StatCard icon={<Sparkles className="w-4 h-4" />}        label="Tier"          value={loading ? '—' : tier}                                    sub="status"   delay={0.15} />
              </div>

              {/* Upcoming */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5C5A50]">Upcoming</p>
                  <button onClick={() => router.push('/booking')} className="flex items-center gap-1 text-xs text-[#C9A84C] hover:underline">
                    Book new <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                {apptLoading ? (
                  <div className="space-y-3">
                    {[0, 1].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : upcoming.length ? (
                  <div className="space-y-3">
                    {upcoming.map((a, i) => <ApptCard key={a.id} appt={a} delay={i * 0.06} />)}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/[0.06] bg-[#111109] p-6 text-center text-sm text-[#5C5A50]">
                    No upcoming appointments.{' '}
                    <button onClick={() => router.push('/booking')} className="text-[#C9A84C] hover:underline">Book one →</button>
                  </div>
                )}
              </div>

              {/* History */}
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5C5A50]">Recent history</p>
                {apptLoading ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : past.length ? (
                  <div className="space-y-3">
                    {past.slice(0, 4).map((a, i) => <ApptCard key={a.id} appt={a} delay={i * 0.06} />)}
                  </div>
                ) : (
                  <p className="text-sm text-[#5C5A50]">No past appointments yet.</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Appointments */}
          {tab === 'Appointments' && (
            <motion.div key="appointments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }} className="space-y-3">
              {apptLoading
                ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)
                : appointments.length
                  ? appointments.map((a, i) => <ApptCard key={a.id} appt={a} delay={i * 0.05} />)
                  : (
                    <div className="rounded-2xl border border-white/[0.06] bg-[#111109] p-10 text-center">
                      <Scissors className="mx-auto mb-4 w-8 h-8 text-[#2C2C24]" />
                      <p className="text-sm text-[#5C5A50]">No appointments found.</p>
                      <button onClick={() => router.push('/booking')} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] px-5 py-2.5 text-xs font-bold text-[#0A0A08]">
                        Book now <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
              }
            </motion.div>
          )}

          {/* Settings */}
          {tab === 'Settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }} className="space-y-4">

              {/* Edit profile card */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#111109] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5C5A50]">Profile info</p>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] px-3 py-1.5 text-xs font-semibold text-[#9A9585] hover:border-[#C9A84C]/30 hover:text-[#C9A84C]"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {editing ? (
                    <motion.div key="edit-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      {[
                        { label: 'Full name', value: editName, onChange: setEditName, type: 'text' },
                        { label: 'Phone', value: editPhone, onChange: setEditPhone, type: 'tel' },
                      ].map(({ label, value, onChange, type }) => (
                        <div key={label}>
                          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5C5A50]">{label}</label>
                          <input
                            type={type}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-full rounded-xl border border-white/[0.1] bg-[#1A1A14] px-4 py-3 text-sm text-[#F0EDE4] outline-none transition-colors focus:border-[#C9A84C]/50"
                          />
                        </div>
                      ))}
                      {/* Email read-only */}
                      <div>
                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5C5A50]">Email (read-only)</label>
                        <input
                          readOnly
                          value={displayEmail}
                          className="w-full cursor-not-allowed rounded-xl border border-white/[0.06] bg-[#111109] px-4 py-3 text-sm text-[#5C5A50] outline-none"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button onClick={() => setEditing(false)} className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-[#5C5A50] hover:text-[#9A9585]">Cancel</button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] py-2.5 text-sm font-bold text-[#0A0A08] disabled:opacity-60"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save changes'}
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="edit-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 text-sm">
                      {[
                        { label: 'Name', value: editName || displayName },
                        { label: 'Email', value: displayEmail },
                        { label: 'Phone', value: editPhone || displayPhone },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between border-b border-white/[0.04] pb-3 last:border-0 last:pb-0">
                          <span className="text-[#5C5A50]">{label}</span>
                          <span className="font-medium text-[#F0EDE4]">{value}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Preferences */}
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5C5A50]">Preferences</p>

                {/* Notifications toggle */}
                <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#111109] p-4">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#C9A84C]/10 text-[#C9A84C]">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#F0EDE4]">Appointment reminders</p>
                    <p className="mt-0.5 text-xs text-[#5C5A50]">{profile?.notification_method ?? 'Email & SMS'}</p>
                  </div>
                  <Toggle on={notifEnabled} onToggle={handleToggleNotifications} />
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#111109] p-4">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#C9A84C]/10 text-[#C9A84C]">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#F0EDE4]">Two-factor authentication</p>
                    <p className="mt-0.5 text-xs text-[#5C5A50]">Extra security for your account</p>
                  </div>
                  <button className="flex items-center gap-1 rounded-xl border border-[#C9A84C]/30 px-3 py-1.5 text-xs font-semibold text-[#C9A84C] hover:bg-[#C9A84C]/10">
                    Enable <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Danger zone */}
              <div className="rounded-2xl border border-red-900/30 bg-red-950/10 p-5">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-800">Danger zone</p>
                <button
                  onClick={handleSignOut}
                  className="text-sm font-semibold text-red-500 hover:text-red-400 hover:underline"
                >
                  Sign out of all devices
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* ── Book CTA ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 flex justify-center"
        >
          <button
            onClick={() => router.push('/booking')}
            className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-[#C9A84C] to-[#E5C97A] px-7 py-3.5 text-sm font-bold text-[#0A0A08] shadow-lg shadow-[#C9A84C]/10 transition-opacity hover:opacity-90"
          >
            Book a new appointment <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

      </div>
    </div>
  );
}