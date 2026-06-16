/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

// ─────────────────────────────────────────────────────────────
//  app/admin/dashboard/page.tsx
//  Admin dashboard — with Slot Management
// ─────────────────────────────────────────────────────────────
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import {
  LogOut, Users, Calendar, BarChart3, ShieldCheck,
  AlertTriangle, X, Plus, CheckCircle, Loader2,
  RefreshCw, Trash2, Edit3, Sparkles, Clock,
} from 'lucide-react';
import { isAdminAuthenticated, adminLogout } from '@/lib/auth';

// ── Types ─────────────────────────────────────────────────────

interface Appointment {
  id: string;
  customer_name: string;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled';
  barber_id: string | null;
  is_emergency: boolean;
  revenue: number;
  notes: string | null;
  barbers: { name: string } | null;
}

interface Barber {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

interface Slot {
  id: string;
  barber_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  barbers?: { name: string } | null;
}

interface EmergencyForm {
  customer_name: string;
  customer_phone: string;
  service_name: string;
  barber_id: string;
  appointment_date: string;
  appointment_time: string;
  revenue: string;
  notes: string;
}

interface SlotForm {
  barber_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
}

// ── Constants ─────────────────────────────────────────────────

const PIE_COLORS = ['#d8b76b', '#f0c85a', '#b58322', '#7c6d44', '#35302a'];

const STATUSES = ['Upcoming', 'In Progress', 'Completed', 'Cancelled'] as const;

const SERVICES = [
  'Hair Cut', 'Beard Trim', 'Hot Towel Shave',
  'Hair + Beard Combo', 'Facial', 'Kids Cut', 'Other',
];

const STATUS_TEXT: Record<string, string> = {
  Completed:    'text-green-400',
  'In Progress':'text-yellow-400',
  Upcoming:     'text-primary',
  Cancelled:    'text-red-400',
};
const STATUS_BG: Record<string, string> = {
  Completed:    'bg-green-400/10  border-green-400/20',
  'In Progress':'bg-yellow-400/10 border-yellow-400/20',
  Upcoming:     'bg-primary/10    border-primary/20',
  Cancelled:    'bg-red-400/10    border-red-400/20',
};

const EMPTY_FORM: EmergencyForm = {
  customer_name: '',
  customer_phone: '',
  service_name: '',
  barber_id: '',
  appointment_date: new Date().toISOString().split('T')[0],
  appointment_time: '',
  revenue: '',
  notes: '',
};

const EMPTY_SLOT_FORM: SlotForm = {
  barber_id: '',
  slot_date: new Date().toISOString().split('T')[0],
  start_time: '',
  end_time: '',
};

const INPUT_CLS =
  'w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm ' +
  'text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50';

// ── Helpers ───────────────────────────────────────────────────

const fmtTime = (t: string) => t?.slice(0, 5) ?? '';
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' });

// ── Small reusable field wrapper ──────────────────────────────

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">
        {label}{required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();

  // ── State ──
  const [ready, setReady]               = useState(false);
  const [fetching, setFetching]         = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers]           = useState<Barber[]>([]);
  const [users, setUsers]               = useState<User[]>([]);
  const [slots, setSlots]               = useState<Slot[]>([]);

  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter]     = useState('');
  const [search, setSearch]             = useState('');

  // Slot filters
  const [slotBarberFilter, setSlotBarberFilter] = useState('All');
  const [slotDateFilter, setSlotDateFilter]     = useState('');

  const [showModal, setShowModal]       = useState(false);
  const [form, setForm]                 = useState<EmergencyForm>(EMPTY_FORM);
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState('');

  const [showSlotModal, setShowSlotModal]   = useState(false);
  const [slotForm, setSlotForm]             = useState<SlotForm>(EMPTY_SLOT_FORM);
  const [slotSubmitting, setSlotSubmitting] = useState(false);
  const [slotFormError, setSlotFormError]   = useState('');

  const [editingId, setEditingId]       = useState<string | null>(null);

  // ── Auth guard ──
  useEffect(() => {
    if (!isAdminAuthenticated()) { router.push('/admin/login'); return; }
    setReady(true);
  }, [router]);

  // ── Data fetch (real Supabase) ──
  const fetchAll = async () => {
    setFetching(true);
    try {
      const { data: appts } = await supabase
        .from('appointments')
        .select('*, barbers(name)')
        .order('appointment_date', { ascending: false });

      const { data: barberRows } = await supabase
        .from('barbers')
        .select('id, name');

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, created_at');

      const { data: slotRows } = await supabase
        .from('slots')
        .select('*, barbers(name)')
        .order('slot_date', { ascending: true })
        .order('start_time', { ascending: true });

      setAppointments((appts ?? []) as Appointment[]);
      setBarbers((barberRows ?? []) as Barber[]);
      setSlots((slotRows ?? []) as Slot[]);
      setUsers(
        (profiles ?? []).map((p: any) => ({
          id: p.id,
          name: p.full_name,
          email: p.email,
          phone: p.phone,
          created_at: p.created_at,
        }))
      );
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    fetchAll();
  }, [ready]);

  // ── Derived stats ──
  const stats = useMemo(() => ({
    total:     appointments.length,
    revenue:   appointments
                 .filter(a => a.status === 'Completed')
                 .reduce((s, a) => s + Number(a.revenue), 0),
    customers: users.length,
    emergency: appointments.filter(a => a.is_emergency).length,
  }), [appointments, users]);

  // ── Chart data ──
  const bookingTrend = useMemo(() => {
    const map: Record<string, { bookings: number; revenue: number }> = {};
    appointments.forEach(a => {
      if (!map[a.appointment_date]) map[a.appointment_date] = { bookings: 0, revenue: 0 };
      map[a.appointment_date].bookings++;
      if (a.status === 'Completed') map[a.appointment_date].revenue += Number(a.revenue);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, v]) => ({
        day: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
        ...v,
      }));
  }, [appointments]);

  const servicePopularity = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach(a => { counts[a.service_name] = (counts[a.service_name] ?? 0) + 1; });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [appointments]);

  // ── Filtered rows ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return appointments.filter(a => {
      if (statusFilter !== 'All' && a.status !== statusFilter) return false;
      if (dateFilter && a.appointment_date !== dateFilter)     return false;
      if (q && !a.customer_name.toLowerCase().includes(q) &&
               !a.service_name.toLowerCase().includes(q))      return false;
      return true;
    });
  }, [appointments, statusFilter, dateFilter, search]);

  // ── Filtered slots ──
  const filteredSlots = useMemo(() => {
    return slots.filter(s => {
      if (slotBarberFilter !== 'All' && s.barber_id !== slotBarberFilter) return false;
      if (slotDateFilter && s.slot_date !== slotDateFilter) return false;
      return true;
    });
  }, [slots, slotBarberFilter, slotDateFilter]);

  // ── Inline status update ──
  const updateStatus = async (id: string, status: string) => {
    setEditingId(null);
    await supabase.from('appointments').update({ status }).eq('id', id);
    setAppointments(prev =>
      prev.map(a => a.id === id ? { ...a, status: status as Appointment['status'] } : a)
    );
  };

  // ── Delete appointment ──
  const deleteAppointment = async (id: string) => {
    if (!confirm('Delete this appointment permanently?')) return;
    await supabase.from('appointments').delete().eq('id', id);
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  // ── Delete slot ──
  const deleteSlot = async (id: string) => {
    if (!confirm('Delete this slot permanently?')) return;
    const { error } = await supabase.from('slots').delete().eq('id', id);
    if (!error) {
      setSlots(prev => prev.filter(s => s.id !== id));
    }
  };

  // ── Toggle slot availability ──
  const toggleSlotAvailability = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('slots')
      .update({ is_available: !current })
      .eq('id', id);
    if (!error) {
      setSlots(prev => prev.map(s => s.id === id ? { ...s, is_available: !current } : s));
    }
  };

  // ── Emergency booking ──
  const patchForm = (patch: Partial<EmergencyForm>) =>
    setForm(f => ({ ...f, ...patch }));

  const submitEmergency = async () => {
    if (!form.customer_name || !form.service_name || !form.appointment_date || !form.appointment_time) {
      setFormError('Customer name, service, date and time are required.');
      return;
    }
    setFormError('');
    setSubmitting(true);

    try {
      const payload = {
        customer_name:    form.customer_name.trim(),
        service_name:     form.service_name,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        barber_id:        form.barber_id || null,
        status:           'Upcoming' as any,
        is_emergency:     true,
        revenue:          parseFloat(form.revenue) || 0,
        notes: [
          form.customer_phone ? `Phone: ${form.customer_phone}` : null,
          form.notes          ? form.notes                      : null,
        ].filter(Boolean).join(' | ') || null,
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert(payload)
        .select('*, barbers(name)')
        .single();

      if (error) throw error;

      setAppointments(prev => [data as Appointment, ...prev]);
      setForm(EMPTY_FORM);
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Create slot ──
  const patchSlotForm = (patch: Partial<SlotForm>) =>
    setSlotForm(f => ({ ...f, ...patch }));

  const submitSlot = async () => {
    if (!slotForm.barber_id || !slotForm.slot_date || !slotForm.start_time || !slotForm.end_time) {
      setSlotFormError('Barber, date, start time and end time are required.');
      return;
    }
    if (slotForm.start_time >= slotForm.end_time) {
      setSlotFormError('End time must be after start time.');
      return;
    }
    setSlotFormError('');
    setSlotSubmitting(true);

    try {
      const payload = {
        barber_id:   slotForm.barber_id,
        slot_date:   slotForm.slot_date,
        start_time:  slotForm.start_time,
        end_time:    slotForm.end_time,
        is_available: true,
      };

      const { data, error } = await supabase
        .from('slots')
        .insert(payload)
        .select('*, barbers(name)')
        .single();

      if (error) throw error;

      setSlots(prev => [...prev, data as Slot].sort((a, b) =>
        a.slot_date.localeCompare(b.slot_date) || a.start_time.localeCompare(b.start_time)
      ));
      setSlotForm(EMPTY_SLOT_FORM);
      setShowSlotModal(false);
    } catch (err: any) {
      setSlotFormError(err.message ?? 'Something went wrong.');
    } finally {
      setSlotSubmitting(false);
    }
  };

  const handleLogout = () => { adminLogout(); router.push('/admin/login'); };

  // ── Loading spinner ──
  if (!ready) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="relative max-w-7xl mx-auto">

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10  left-1/3  h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-10 right-1/3 h-80 w-80 rounded-full bg-accent/10  blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 space-y-8"
        >

          {/* ══ Header ══ */}
          <header className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary">Admin Console</p>
                <h1 className="mt-4 text-4xl font-black text-foreground">
                  Sahil Cutzz Command Center
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {fetching && (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" /> Syncing…
                  </span>
                )}
                <button
                  onClick={fetchAll}
                  className="inline-flex items-center gap-2 rounded-3xl border border-border bg-background/90 px-4 py-3 text-sm font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
                  Admin
                </span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-3xl border border-border bg-background/90 px-5 py-3 text-sm font-semibold text-muted-foreground hover:border-red-600/50 hover:text-red-500 transition-all"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          </header>

          {/* ══ Quick Stats ══ */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {([
              { label: 'Total Appointments', value: stats.total,                          icon: Calendar,    color: '#d8b76b' },
              { label: 'Revenue',            value: `$${stats.revenue.toLocaleString()}`, icon: BarChart3,   color: '#f0c85a' },
              { label: 'Registered Users',   value: stats.customers,                      icon: Users,       color: '#b58322' },
              { label: 'Emergency Bookings', value: stats.emergency,                      icon: ShieldCheck, color: '#ecb12c' },
            ] as const).map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="rounded-[32px] border border-border bg-background/90 p-6 shadow-sm"
              >
                <div className="inline-flex items-center gap-3">
                  <s.icon className="w-6 h-6" style={{ color: s.color }} />
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">{s.label}</p>
                    <p className="mt-3 text-3xl font-black text-foreground">{s.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ══ Charts ══ */}
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">

            {/* Line chart */}
            <section className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.35em] text-primary">Booking Analytics</p>
              <h2 className="mt-3 text-2xl font-black text-foreground">Daily bookings &amp; revenue</h2>
              <div className="mt-8 h-[330px]">
                {bookingTrend.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bookingTrend} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="day"      stroke="#a69d87" />
                      <YAxis                    stroke="#a69d87" />
                      <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(216,183,107,0.25)' }} />
                      <Line type="monotone" dataKey="bookings" stroke="#d8b76b" strokeWidth={4} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="revenue"  stroke="#f0c85a" strokeWidth={4} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No appointment data yet
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-6">
              {/* Pie chart */}
              <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.35em] text-primary">Service popularity</p>
                <h2 className="mt-3 text-2xl font-black text-foreground">Top performers</h2>
                <div className="mt-8 h-[220px]">
                  {servicePopularity.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={servicePopularity}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={4}
                        >
                          {servicePopularity.map((e, i) => (
                            <Cell key={e.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(216,183,107,0.25)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data yet</div>
                  )}
                </div>
              </div>

              {/* Quick actions */}
              <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.35em] text-primary">Actions</p>
                <div className="mt-6 grid gap-4">
                  {([
                    { label: 'Manage barbers',           desc: 'Add or update barber schedules and profiles.',         icon: Users,         action: undefined },
                    { label: 'Insert emergency booking',  desc: 'Override the timeline with an urgent walk-in.',        icon: AlertTriangle, action: () => setShowModal(true) },
                    { label: 'Create availability slots', desc: 'Open new time slots for customers to book.',           icon: Clock,         action: () => setShowSlotModal(true) },
                    { label: 'Review analytics',         desc: 'Service popularity, peak hours, revenue trends.',      icon: Sparkles,      action: undefined },
                  ] as const).map(item => (
                    <div
                      key={item.label}
                      onClick={item.action}
                      className={`rounded-3xl border border-border bg-background/90 p-4 hover:border-primary/40 transition-colors ${item.action ? 'cursor-pointer' : ''}`}
                    >
                      <item.icon className="w-5 h-5 text-primary" />
                      <p className="mt-3 font-semibold text-foreground">{item.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          {/* ══ Appointments table ══ */}
          <section className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">

            {/* Table header + controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary">Appointment feed</p>
                <h2 className="mt-3 text-2xl font-black text-foreground">Manage every booking</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search name or service…"
                  className="rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 w-52"
                />
                {/* Date filter */}
                <input
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                >
                  <option value="All">All statuses</option>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                {/* Clear filters */}
                {(statusFilter !== 'All' || dateFilter || search) && (
                  <button
                    onClick={() => { setStatusFilter('All'); setDateFilter(''); setSearch(''); }}
                    className="rounded-2xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                )}
                {/* Emergency CTA */}
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
                >
                  <Plus className="w-4 h-4" /> Emergency Booking
                </button>
              </div>
            </div>

            {/* Result count */}
            <p className="mt-4 text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {appointments.length} appointments
            </p>

            {/* Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-muted-foreground">
                <thead className="border-b border-border text-xs uppercase tracking-[0.25em]">
                  <tr>
                    {['Customer', 'Service', 'Barber', 'Date', 'Time', 'Status', 'Revenue', ''].map(h => (
                      <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {!filtered.length && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                        {fetching ? 'Loading…' : 'No appointments match your filters.'}
                      </td>
                    </tr>
                  )}
                  {filtered.map(item => (
                    <tr key={item.id} className="hover:bg-background/80 transition-colors">

                      {/* Customer */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold whitespace-nowrap">{item.customer_name}</span>
                          {item.is_emergency && (
                            <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold uppercase text-red-400 whitespace-nowrap">
                              EMERGENCY
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 max-w-[160px] truncate" title={item.notes}>
                            {item.notes}
                          </p>
                        )}
                      </td>

                      {/* Service */}
                      <td className="px-4 py-4 whitespace-nowrap">{item.service_name}</td>

                      {/* Barber */}
                      <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                        {item.barbers?.name ?? '—'}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 whitespace-nowrap">{fmtDate(item.appointment_date)}</td>

                      {/* Time */}
                      <td className="px-4 py-4 whitespace-nowrap">{fmtTime(item.appointment_time)}</td>

                      {/* Status — click to edit inline */}
                      <td className="px-4 py-4">
                        {editingId === item.id ? (
                          <select
                            autoFocus
                            defaultValue={item.status}
                            onBlur={e  => updateStatus(item.id, e.target.value)}
                            onChange={e => updateStatus(item.id, e.target.value)}
                            className="rounded-xl border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none"
                          >
                            {STATUSES.map(s => <option key={s}>{s}</option>)}
                          </select>
                        ) : (
                          <span
                            onClick={() => setEditingId(item.id)}
                            title="Click to change status"
                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer hover:opacity-70 transition-opacity whitespace-nowrap ${STATUS_TEXT[item.status]} ${STATUS_BG[item.status]}`}
                          >
                            {item.status}
                            <Edit3 className="w-3 h-3 opacity-40" />
                          </span>
                        )}
                      </td>

                      {/* Revenue */}
                      <td className="px-4 py-4 font-bold whitespace-nowrap">
                        ${Number(item.revenue).toFixed(0)}
                      </td>

                      {/* Delete */}
                      <td className="px-4 py-4">
                        <button
                          onClick={() => deleteAppointment(item.id)}
                          title="Delete appointment"
                          className="rounded-xl border border-red-500/20 p-2 text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ══ Slot Management table ══ */}
          <section className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary">Availability</p>
                <h2 className="mt-3 text-2xl font-black text-foreground">Manage booking slots</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Barber filter */}
                <select
                  value={slotBarberFilter}
                  onChange={e => setSlotBarberFilter(e.target.value)}
                  className="rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                >
                  <option value="All">All barbers</option>
                  {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {/* Date filter */}
                <input
                  type="date"
                  value={slotDateFilter}
                  onChange={e => setSlotDateFilter(e.target.value)}
                  className="rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
                {/* Clear */}
                {(slotBarberFilter !== 'All' || slotDateFilter) && (
                  <button
                    onClick={() => { setSlotBarberFilter('All'); setSlotDateFilter(''); }}
                    className="rounded-2xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                )}
                {/* Create slot CTA */}
                <button
                  onClick={() => setShowSlotModal(true)}
                  className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
                >
                  <Plus className="w-4 h-4" /> Create Slot
                </button>
              </div>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredSlots.length}</span> of {slots.length} slots
            </p>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-muted-foreground">
                <thead className="border-b border-border text-xs uppercase tracking-[0.25em]">
                  <tr>
                    {['Barber', 'Date', 'Start', 'End', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {!filteredSlots.length && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        {fetching ? 'Loading…' : 'No slots found. Create one to get started.'}
                      </td>
                    </tr>
                  )}
                  {filteredSlots.map(slot => (
                    <tr key={slot.id} className="hover:bg-background/80 transition-colors">

                      {/* Barber */}
                      <td className="px-4 py-4 font-semibold whitespace-nowrap">
                        {slot.barbers?.name ?? barbers.find(b => b.id === slot.barber_id)?.name ?? '—'}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 whitespace-nowrap">{fmtDate(slot.slot_date)}</td>

                      {/* Start */}
                      <td className="px-4 py-4 whitespace-nowrap">{fmtTime(slot.start_time)}</td>

                      {/* End */}
                      <td className="px-4 py-4 whitespace-nowrap">{fmtTime(slot.end_time)}</td>

                      {/* Availability toggle */}
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleSlotAvailability(slot.id, slot.is_available)}
                          title="Click to toggle availability"
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer hover:opacity-70 transition-opacity whitespace-nowrap ${
                            slot.is_available
                              ? 'text-green-400 bg-green-400/10 border-green-400/20'
                              : 'text-muted-foreground bg-border/30 border-border'
                          }`}
                        >
                          {slot.is_available ? 'Available' : 'Booked'}
                          <Edit3 className="w-3 h-3 opacity-40" />
                        </button>
                      </td>

                      {/* Delete */}
                      <td className="px-4 py-4">
                        <button
                          onClick={() => deleteSlot(slot.id)}
                          title="Delete slot"
                          className="rounded-xl border border-red-500/20 p-2 text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ══ Registered Users table ══ */}
          <section className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.35em] text-primary">User registry</p>
            <h2 className="mt-3 text-2xl font-black text-foreground">Registered customers</h2>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-muted-foreground">
                <thead className="border-b border-border text-xs uppercase tracking-[0.25em]">
                  <tr>
                    {['Name', 'Email', 'Phone', 'Joined'].map(h => (
                      <th key={h} className="px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {!users.length && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                        {fetching ? 'Loading…' : 'No users yet.'}
                      </td>
                    </tr>
                  )}
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-background/80 transition-colors">
                      <td className="px-4 py-4 font-semibold">{u.name}</td>
                      <td className="px-4 py-4 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-4 text-muted-foreground">{u.phone ?? '—'}</td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </motion.div>
      </div>

      {/* ══ Emergency Booking Modal ══ */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={  { opacity: 0, scale: 0.93,  y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative z-10 w-full max-w-lg rounded-[32px] border border-border bg-card/95 p-8 shadow-2xl backdrop-blur-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-400">
                    <AlertTriangle className="w-3 h-3" /> Emergency
                  </span>
                  <h2 className="mt-4 text-2xl font-black text-foreground">Override Booking</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Insert a high-priority walk-in. Saved with <code className="text-primary text-xs">is_emergency = true</code>.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-2xl border border-border p-2 text-muted-foreground hover:text-foreground transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <p className="mt-4 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {formError}
                </p>
              )}

              <div className="mt-6 space-y-4">
                <Field label="Customer Name" required>
                  <input value={form.customer_name} onChange={e => patchForm({ customer_name: e.target.value })} placeholder="e.g. Ahmed Khan" className={INPUT_CLS} />
                </Field>
                <Field label="Phone">
                  <input value={form.customer_phone} onChange={e => patchForm({ customer_phone: e.target.value })} placeholder="+92 300 000 0000" className={INPUT_CLS} />
                </Field>
                <Field label="Service Name" required>
                  <select value={form.service_name} onChange={e => patchForm({ service_name: e.target.value })} className={INPUT_CLS}>
                    <option value="">— Select service —</option>
                    {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Barber">
                  <select value={form.barber_id} onChange={e => patchForm({ barber_id: e.target.value })} className={INPUT_CLS}>
                    <option value="">— Any available barber —</option>
                    {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date" required>
                    <input type="date" value={form.appointment_date} onChange={e => patchForm({ appointment_date: e.target.value })} className={INPUT_CLS} />
                  </Field>
                  <Field label="Time" required>
                    <input type="time" value={form.appointment_time} onChange={e => patchForm({ appointment_time: e.target.value })} className={INPUT_CLS} />
                  </Field>
                </div>
                <Field label="Revenue ($)">
                  <input type="number" min="0" step="0.01" value={form.revenue} onChange={e => patchForm({ revenue: e.target.value })} placeholder="45" className={INPUT_CLS} />
                </Field>
                <Field label="Notes / Reason">
                  <textarea value={form.notes} onChange={e => patchForm({ notes: e.target.value })} rows={2} placeholder="Reason for emergency, special instructions…" className={`${INPUT_CLS} resize-none`} />
                </Field>
              </div>

              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 rounded-3xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all">
                  Cancel
                </button>
                <button
                  onClick={submitEmergency}
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60 transition-all"
                >
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking…</> : <><CheckCircle className="w-4 h-4" /> Confirm Booking</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Create Slot Modal ══ */}
      <AnimatePresence>
        {showSlotModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowSlotModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={  { opacity: 0, scale: 0.93,  y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative z-10 w-full max-w-lg rounded-[32px] border border-border bg-card/95 p-8 shadow-2xl backdrop-blur-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                    <Clock className="w-3 h-3" /> Availability
                  </span>
                  <h2 className="mt-4 text-2xl font-black text-foreground">Create Slot</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Open a new time slot for customers to book online.
                  </p>
                </div>
                <button
                  onClick={() => setShowSlotModal(false)}
                  className="rounded-2xl border border-border p-2 text-muted-foreground hover:text-foreground transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {slotFormError && (
                <p className="mt-4 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {slotFormError}
                </p>
              )}

              <div className="mt-6 space-y-4">
                <Field label="Barber" required>
                  <select
                    value={slotForm.barber_id}
                    onChange={e => patchSlotForm({ barber_id: e.target.value })}
                    className={INPUT_CLS}
                  >
                    <option value="">— Select barber —</option>
                    {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </Field>

                <Field label="Date" required>
                  <input
                    type="date"
                    value={slotForm.slot_date}
                    onChange={e => patchSlotForm({ slot_date: e.target.value })}
                    className={INPUT_CLS}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start Time" required>
                    <input
                      type="time"
                      value={slotForm.start_time}
                      onChange={e => patchSlotForm({ start_time: e.target.value })}
                      className={INPUT_CLS}
                    />
                  </Field>
                  <Field label="End Time" required>
                    <input
                      type="time"
                      value={slotForm.end_time}
                      onChange={e => patchSlotForm({ end_time: e.target.value })}
                      className={INPUT_CLS}
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => { setShowSlotModal(false); setSlotFormError(''); setSlotForm(EMPTY_SLOT_FORM); }}
                  className="flex-1 rounded-3xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={submitSlot}
                  disabled={slotSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60 transition-all"
                >
                  {slotSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><CheckCircle className="w-4 h-4" /> Create Slot</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}