/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

// ─────────────────────────────────────────────────────────────
//  app/admin/dashboard/page.tsx
// ─────────────────────────────────────────────────────────────
import { supabase } from '@/lib/supabase';
import { useEffect, useMemo, useState } from 'react';
import { getAdminToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import {
  LogOut, Users, Calendar, BarChart3, ShieldCheck,
  AlertTriangle, X, Plus, CheckCircle, Loader2,
  RefreshCw, Trash2, Edit3, Clock,
  Scissors, Timer, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { getSession, adminLogout } from '@/lib/auth';

// ── Types ─────────────────────────────────────────────────────

interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  service_name: string;
  service_category: string;
  appointment_date: string;
  appointment_time: string;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled' | 'Expired';
  barber_id: string | null;
  payment_id?: string | null;
  amount?: number;
  is_emergency?: boolean;
  revenue: number;
  notes: string | null;
  barbers: { name: string } | null;
}

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_type: string;
  created_at: string;
  completed_at?: string | null;
}

interface Barber   {
  id: string;
  name: string;
  is_available?: boolean;
  working_hours?: {
    start: string;
    end: string;
    breaks?: { start: string; end: string }[];
    off_days?: string[];
    unavailable_dates?: string[];
  };
}
interface User     { id: string; name: string; email: string; phone: string | null; created_at: string; }
interface Service  { id: string; name: string; duration_minutes: number; price: number; description: string | null; category: string | null; is_active: boolean; }
interface Slot     { id: string; barber_id: string; slot_date: string; start_time: string; end_time: string; is_available: boolean; barbers?: { name: string } | null; }

interface EmergencyForm {
  customer_name: string; customer_phone: string; service_name: string;
  barber_id: string; appointment_date: string; appointment_time: string;
  revenue: string; notes: string;
}
interface AvailabilityForm { barber_id: string; slot_date: string; from_time: string; to_time: string; }
interface ServiceForm      { name: string; duration_minutes: string; price: string; category: string; description: string; }

// ── Constants ─────────────────────────────────────────────────

const PIE_COLORS = ['#d8b76b', '#f0c85a', '#b58322', '#7c6d44', '#35302a'];
const STATUSES   = ['Upcoming', 'In Progress', 'Completed', 'Cancelled', 'Expired'] as const;

const STATUS_TEXT: Record<string, string> = {
  Completed: 'text-green-400', 'In Progress': 'text-yellow-400', Upcoming: 'text-primary', Cancelled: 'text-red-400', Expired: 'text-muted-foreground',
};
const STATUS_BG: Record<string, string> = {
  Completed: 'bg-green-400/10 border-green-400/20', 'In Progress': 'bg-yellow-400/10 border-yellow-400/20',
  Upcoming: 'bg-primary/10 border-primary/20', Cancelled: 'bg-red-400/10 border-red-400/20', Expired: 'bg-border/30 border-border',
};

const EMPTY_FORM: EmergencyForm = {
  customer_name: '', customer_phone: '', service_name: '', barber_id: '',
  appointment_date: new Date().toISOString().split('T')[0], appointment_time: '', revenue: '', notes: '',
};
const EMPTY_AVAILABILITY: AvailabilityForm = {
  barber_id: '', slot_date: new Date().toISOString().split('T')[0], from_time: '09:00', to_time: '19:00',
};
const EMPTY_SERVICE_FORM: ServiceForm = { name: '', duration_minutes: '30', price: '', category: '', description: '' };
const DEFAULT_SERVICE_CATEGORIES = ['Hair Cut', 'Beard', 'Packages', 'Care & Styling', 'Color', 'Other'];

const INPUT_CLS =
  'w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm ' +
  'text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50';

// ── Helpers ───────────────────────────────────────────────────

const fmtTime = (t: string) => {
  if (!t) return '';
  const [hoursStr, minutesStr] = t.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return t.slice(0, 5);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
};
const fmtDate = (d: string) => {
  return new Date(d + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' });
};

function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateTimeFromParts(date: string, time: string): Date {
  return new Date(`${date}T${(time || '00:00').slice(0, 5)}:00`);
}

function isAppointmentExpired(appt: Appointment): boolean {
  if (['Completed', 'Cancelled', 'Expired'].includes(appt.status)) return false;
  return dateTimeFromParts(appt.appointment_date, appt.appointment_time).getTime() < Date.now();
}

function appointmentDisplayStatus(appt: Appointment): Appointment['status'] {
  const normalizedStatus = normalizeStatus(appt.status);
  return isAppointmentExpired({ ...appt, status: normalizedStatus }) ? 'Expired' : normalizedStatus;
}

function isSlotExpired(slot: Slot): boolean {
  return dateTimeFromParts(slot.slot_date, slot.end_time).getTime() < Date.now();
}

function splitStoredCustomer(value?: string | null): { name: string; phone: string | null } {
  const text = value?.trim();
  if (!text) return { name: '', phone: null };

  const match = text.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (!match) return { name: text, phone: null };

  return {
    name: match[1].trim(),
    phone: match[2].trim(),
  };
}

function windowCapacity(fromTime: string, toTime: string, durationMins: number): number {
  if (!fromTime || !toTime || !durationMins) return 0;
  const [fh, fm] = fromTime.split(':').map(Number);
  const [th, tm] = toTime.split(':').map(Number);
  const totalMins = (th * 60 + tm) - (fh * 60 + fm);
  return totalMins <= 0 ? 0 : Math.floor(totalMins / durationMins);
}

function isPastDateTime(date: string, time: string): boolean {
  const now      = new Date();
  const todayStr = now.toISOString().split('T')[0];
  if (date < todayStr) return true;
  if (date === todayStr) {
    const [h, m] = time.split(':').map(Number);
    return (h * 60 + m) <= (now.getHours() * 60 + now.getMinutes());
  }
  return false;
}

function normalizeStatus(status: unknown): Appointment['status'] {
  const value = String(status || '').trim().toLowerCase();
  if (['completed', 'complete', 'confirmed', 'paid'].includes(value)) return 'Completed';
  if (['in progress', 'in_progress', 'inprogress', 'active'].includes(value)) return 'In Progress';
  if (['cancelled', 'canceled', 'cancelled_by_customer', 'cancelled_by_admin'].includes(value)) return 'Cancelled';
  if (['expired', 'late'].includes(value)) return 'Expired';
  return 'Upcoming';
}

function getDisplayDate(dateValue: unknown, fallbackDate: Date): string {
  if (typeof dateValue === 'string' && dateValue.trim()) {
    const trimmed = dateValue.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  }
  return fallbackDate.toISOString().split('T')[0];
}

function getDisplayTime(timeValue: unknown, fallbackDate: Date): string {
  if (typeof timeValue === 'string' && timeValue.trim()) return timeValue.slice(0, 5);
  return fallbackDate.toTimeString().slice(0, 5);
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
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

  const [ready, setReady]               = useState(false);
  const [fetching, setFetching]         = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments]         = useState<Payment[]>([]);
  const [barbers, setBarbers]           = useState<Barber[]>([]);
  const [users, setUsers]               = useState<User[]>([]);
  const [slots, setSlots]               = useState<Slot[]>([]);
  const [services, setServices]         = useState<Service[]>([]);

  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter]     = useState('');
  const [search, setSearch]             = useState('');
  const [summaryMode, setSummaryMode]   = useState<'day' | 'range'>('day');
  const [summaryDate, setSummaryDate]   = useState(localDateKey());
  const [summaryStartDate, setSummaryStartDate] = useState(localDateKey());
  const [summaryEndDate, setSummaryEndDate] = useState(localDateKey());
  const [slotBarberFilter, setSlotBarberFilter] = useState('All');
  const [slotDateFilter, setSlotDateFilter]     = useState(localDateKey());
  const [analyticsStartDate, setAnalyticsStartDate] = useState('');
  const [analyticsEndDate, setAnalyticsEndDate] = useState('');

  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState<EmergencyForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');
  const [emergencyNotice, setEmergencyNotice] = useState('');

  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [availForm, setAvailForm]       = useState<AvailabilityForm>(EMPTY_AVAILABILITY);
  const [availSubmitting, setAvailSubmitting] = useState(false);
  const [availError, setAvailError]     = useState('');

  const [showServiceModal, setShowServiceModal]   = useState(false);
  const [serviceForm, setServiceForm]             = useState<ServiceForm>(EMPTY_SERVICE_FORM);
  const [serviceSubmitting, setServiceSubmitting] = useState(false);
  const [serviceError, setServiceError]           = useState('');
  const [editingServiceId, setEditingServiceId]   = useState<string | null>(null);
  const [categoryForm, setCategoryForm]           = useState({ serviceId: '', category: '' });
  const [categorySavingId, setCategorySavingId]   = useState<string | null>(null);
  const [categoryError, setCategoryError]         = useState('');
  const [editingId, setEditingId]                 = useState<string | null>(null);
  const [appointmentPage, setAppointmentPage]     = useState(1);
  const [customerPage, setCustomerPage]           = useState(1);

  // ── Unavailability Management State ──
  const [unavailBarberId, setUnavailBarberId] = useState<string>('');
  const [selectedOffDays, setSelectedOffDays] = useState<string[]>(['Sun']);
  const [blockedDates, setBlockedDates]       = useState<string[]>([]);
  const [newBlockedDate, setNewBlockedDate]   = useState<string>('');
  const [unavailSaving, setUnavailSaving]     = useState<boolean>(false);
  const [unavailMessage, setUnavailMessage]   = useState<string>('');

  useEffect(() => {
    if (barbers.length > 0 && !unavailBarberId) {
      setUnavailBarberId(barbers[0].id);
    }
  }, [barbers, unavailBarberId]);

  useEffect(() => {
    if (!unavailBarberId) return;
    const b = barbers.find((item) => item.id === unavailBarberId);
    if (b && b.working_hours) {
      setSelectedOffDays(b.working_hours.off_days || ['Sun']);
      setBlockedDates(b.working_hours.unavailable_dates || []);
    }
  }, [unavailBarberId, barbers]);

  const toggleOffDay = (day: string) => {
    setSelectedOffDays((prev) =>
      prev.some((d) => d.toLowerCase() === day.toLowerCase())
        ? prev.filter((d) => d.toLowerCase() !== day.toLowerCase())
        : [...prev, day]
    );
  };

  const addBlockedDate = () => {
    if (!newBlockedDate) return;
    if (!blockedDates.includes(newBlockedDate)) {
      setBlockedDates((prev) => [...prev, newBlockedDate].sort());
    }
    setNewBlockedDate('');
  };

  const removeBlockedDate = (dateToRemove: string) => {
    setBlockedDates((prev) => prev.filter((d) => d !== dateToRemove));
  };

  const saveUnavailabilitySettings = async () => {
    if (!unavailBarberId) return;
    setUnavailSaving(true);
    setUnavailMessage('');
    try {
      const targetBarber = barbers.find((b) => b.id === unavailBarberId);
      const currentWorkingHours = targetBarber?.working_hours || {
        start: '09:00',
        end: '19:00',
        breaks: [{ start: '13:00', end: '14:00' }],
        off_days: ['Sun'],
      };

      const updatedWorkingHours = {
        ...currentWorkingHours,
        off_days: selectedOffDays,
        unavailable_dates: blockedDates,
      };

      const res = await fetch('/api/barbers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: unavailBarberId,
          working_hours: updatedWorkingHours,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save unavailability settings');
      }

      setBarbers((prev) =>
        prev.map((b) =>
          b.id === unavailBarberId ? { ...b, working_hours: updatedWorkingHours } : b
        )
      );

      setUnavailMessage(
        '✅ Unavailability settings saved successfully! Users cannot view or book slots on these days.'
      );
    } catch (err: any) {
      setUnavailMessage(`❌ Error: ${err.message || 'Unable to save settings'}`);
    } finally {
      setUnavailSaving(false);
    }
  };

  // ── Auth guard ──
  useEffect(() => {
    const session = getSession();
    const isAdmin = session?.user.role === 'admin' || getAdminToken() === 'admin_verified';
    if (!isAdmin) {
      router.push('/admin/login');
      return;
    }
    void Promise.resolve().then(() => setReady(true));
  }, [router]);

  // ── Data fetch ──
  const fetchAll = async () => {
    setFetching(true);
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'x-admin-token': getAdminToken() ?? '',
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? 'Unable to load admin dashboard data');
      }

      const appointmentRows = Array.isArray(result.appointments) ? result.appointments : [];
      const barberList = Array.isArray(result.barbers) ? result.barbers : [];
      const usersList = Array.isArray(result.users) ? result.users : [];
      const slotRows = Array.isArray(result.slots) ? result.slots : [];
      const servicesList = Array.isArray(result.services) ? result.services : [];

      setBarbers(barberList as Barber[]);

      const apptData = appointmentRows.map((a: any) => {
        const startDate = a.start_at ? new Date(a.start_at) : new Date(a.created_at || Date.now());
        const rawStatus = normalizeStatus(a.status);
        const user = usersList.find((u: any) => u.id === a.user_id || u.email === a.customer_email || u.email === a.email);
        const service = servicesList.find((s: any) => s.id === a.service_id || s.name === a.service_name);
        const storedCustomer = splitStoredCustomer(a.customer_name);
        const profileName = user?.full_name || user?.name || storedCustomer.name || a.customer_name || a.customer_email || a.email || 'Unknown User';
        const profilePhone = user?.phone || a.customer_phone || storedCustomer.phone || a.phone || null;
        const appointmentDate = getDisplayDate(a.appointment_date || a.date || a.start_at, startDate);
        const appointmentTime = getDisplayTime(a.appointment_time || a.time, startDate);

        return {
          id: a.id,
          customer_name:    profileName,
          customer_phone:   profilePhone,
          service_name:     service?.name || a.service_name || 'Unknown Service',
          service_category: service?.category || a.service_category || 'Other',
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          status:           rawStatus,
          barber_id:        a.barber_id,
          payment_id:      a.payment_id ?? null,
          is_emergency:     a.is_emergency ?? false,
          revenue:          Number(a.revenue ?? service?.price ?? a.amount ?? 0),
          notes:            a.notes ?? null,
          barbers: a.barber_id
            ? { name: barberList.find((b: any) => b.id === a.barber_id)?.name ?? '' }
            : null,
        };
      }) as Appointment[];

      setAppointments(apptData);

      const paymentsList = Array.isArray(result.payments) ? result.payments : [];
      setPayments(paymentsList as Payment[]);

      const slotData = slotRows.map((s: any) => ({
        ...s,
        barbers: s.barber_id
          ? { name: barberList.find((b: any) => b.id === s.barber_id)?.name ?? '' }
          : null,
      })) as Slot[];

      setSlots(slotData);
      setServices(servicesList as Service[]);
      setPayments(
        (Array.isArray(result.payments) ? result.payments : []) as Payment[]
      );
      setUsers(
        usersList
          .map((p: any) => ({
            id:         p.id,
            name:       p.full_name || p.name || p.email,
            email:      p.email,
            phone:      p.phone,
            created_at: p.created_at,
          }))
          .sort((a: User, b: User) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );
    } catch (err) {
      console.error('fetchAll error:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { if (!ready) return; void Promise.resolve().then(() => fetchAll()); }, [ready]);

  // ── Real-time subscription ──
  useEffect(() => {
    if (!ready) return;
    const channel = supabase
      .channel('appointments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchAll();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ready]);

  // ── Derived stats ──
  const stats = useMemo(() => ({
    total: (() => {
      if (!analyticsStartDate && !analyticsEndDate) return appointments.length;
      return appointments.filter(a => {
        const apptDate = a.appointment_date || null;
        if (!apptDate) return false;
        if (analyticsStartDate && apptDate < analyticsStartDate) return false;
        if (analyticsEndDate && apptDate > analyticsEndDate) return false;
        return true;
      }).length;
    })(),
    revenue: appointments
      .filter(a => normalizeStatus(a.status) === 'Completed')
      .filter(a => {
        if (!analyticsStartDate && !analyticsEndDate) return true;
        const apptDate = a.appointment_date || null;
        if (!apptDate) return false;
        if (analyticsStartDate && apptDate < analyticsStartDate) return false;
        if (analyticsEndDate && apptDate > analyticsEndDate) return false;
        return true;
      })
      .reduce((s, a) => s + Number(a.revenue), 0)
      + payments
        .filter(p => String(p.status || '').toLowerCase() === 'completed')
        .filter(p => {
          if (!analyticsStartDate && !analyticsEndDate) return true;
          const created = p.completed_at ? String(p.completed_at).slice(0, 10) : (p.created_at ? String(p.created_at).slice(0, 10) : null);
          if (!created) return false;
          if (analyticsStartDate && created < analyticsStartDate) return false;
          if (analyticsEndDate && created > analyticsEndDate) return false;
          return true;
        })
        .filter(p => !appointments.some(a => a.payment_id === p.id))
        .reduce((s, p) => s + Number(p.amount), 0),
    customers: (() => {
      if (!analyticsStartDate && !analyticsEndDate) return users.length;
      return users.filter(u => {
        const created = u.created_at ? String(u.created_at).slice(0,10) : null;
        if (!created) return false;
        if (analyticsStartDate && created < analyticsStartDate) return false;
        if (analyticsEndDate && created > analyticsEndDate) return false;
        return true;
      }).length;
    })(),
    emergency: appointments.filter(a => {
      if (!a.is_emergency) return false;
      if (!analyticsStartDate && !analyticsEndDate) return true;
      const apptDate = a.appointment_date || null;
      if (!apptDate) return false;
      if (analyticsStartDate && apptDate < analyticsStartDate) return false;
      if (analyticsEndDate && apptDate > analyticsEndDate) return false;
      return true;
    }).length,
  }), [appointments, payments, users, analyticsStartDate, analyticsEndDate]);

  const bookingTrend = useMemo(() => {
    const map: Record<string, { bookings: number; revenue: number }> = {};
    appointments.forEach(a => {
      const apptDate = a.appointment_date || ((a as any).start_at ? String((a as any).start_at).slice(0,10) : null);
      if (analyticsStartDate && apptDate && apptDate < analyticsStartDate) return;
      if (analyticsEndDate && apptDate && apptDate > analyticsEndDate) return;
      if (!map[a.appointment_date]) map[a.appointment_date] = { bookings: 0, revenue: 0 };
      map[a.appointment_date].bookings++;
      if (normalizeStatus(a.status) === 'Completed') map[a.appointment_date].revenue += Number(a.revenue);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-7)
      .map(([date, v]) => ({ day: new Date(date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' }), ...v }));
  }, [appointments, analyticsStartDate, analyticsEndDate]);

  const summaryAppointments = useMemo(() => {
    return appointments.filter(a => {
      const apptDate = a.appointment_date || ((a as any).start_at ? String((a as any).start_at).slice(0, 10) : null);
      if (!apptDate) return false;
      if (summaryMode === 'day') {
        if (!summaryDate) return false;
        return apptDate === summaryDate;
      }
      if (summaryStartDate && apptDate < summaryStartDate) return false;
      if (summaryEndDate && apptDate > summaryEndDate) return false;
      return true;
    });
  }, [appointments, summaryMode, summaryDate, summaryStartDate, summaryEndDate]);

  const summaryCounts = useMemo(() => {
    const list = summaryAppointments;
    return {
      total: list.length,
      completed: list.filter(a => normalizeStatus(a.status) === 'Completed').length,
      upcoming: list.filter(a => ['Upcoming', 'In Progress'].includes(normalizeStatus(a.status))).length,
      cancelled: list.filter(a => normalizeStatus(a.status) === 'Cancelled').length,
    };
  }, [summaryAppointments]);

  const summaryRevenue = useMemo(() => {
    const completedAppointmentRevenue = summaryAppointments
      .filter(a => normalizeStatus(a.status) === 'Completed')
      .reduce((sum, a) => sum + Number(a.revenue || 0), 0);

    const paymentDateMatches = (date: string | null) => {
      if (!date) return false;
      if (summaryMode === 'day') {
        return summaryDate ? date === summaryDate : false;
      }
      if (summaryStartDate && date < summaryStartDate) return false;
      if (summaryEndDate && date > summaryEndDate) return false;
      return true;
    };

    const standalonePayments = payments
      .filter(p => ['completed', 'success', 'paid', 'settled'].includes(String(p.status || '').toLowerCase()))
      .filter(p => {
        const completed = p.completed_at ? String(p.completed_at).slice(0, 10) : (p.created_at ? String(p.created_at).slice(0, 10) : null);
        return paymentDateMatches(completed);
      })
      .filter(p => !summaryAppointments.some(a => a.payment_id === p.id))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return completedAppointmentRevenue + standalonePayments;
  }, [summaryAppointments, payments, summaryMode, summaryDate, summaryStartDate, summaryEndDate]);

  const servicePopularity = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach(a => {
      const apptDate = a.appointment_date || ((a as any).start_at ? String((a as any).start_at).slice(0,10) : null);
      if (!apptDate) return; // skip entries without a concrete date for category analytics
      if (analyticsStartDate && apptDate < analyticsStartDate) return;
      if (analyticsEndDate && apptDate > analyticsEndDate) return;
      counts[a.service_category || 'Other'] = (counts[a.service_category || 'Other'] ?? 0) + 1;
    });
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, value]) => ({ name, value }));
  }, [appointments, analyticsStartDate, analyticsEndDate]);

  const serviceCategories = useMemo(() => {
    const categorySet = new Set(DEFAULT_SERVICE_CATEGORIES);
    services.forEach(service => {
      const category = service.category?.trim();
      if (category) categorySet.add(category);
    });
    return Array.from(categorySet).sort((a, b) => {
      const aIndex = DEFAULT_SERVICE_CATEGORIES.indexOf(a);
      const bIndex = DEFAULT_SERVICE_CATEGORIES.indexOf(b);
      if (aIndex !== -1 || bIndex !== -1) {
        return (aIndex === -1 ? DEFAULT_SERVICE_CATEGORIES.length : aIndex) -
          (bIndex === -1 ? DEFAULT_SERVICE_CATEGORIES.length : bIndex);
      }
      return a.localeCompare(b);
    });
  }, [services]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const today = localDateKey();
    // By default show past and near-future appointments (next 30 days) so admin can see upcoming bookings
    const futureCutoff = (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().slice(0, 10);
    })();

    return appointments.filter(a => {
      const status = appointmentDisplayStatus(a);
      if (statusFilter !== 'All' && status !== statusFilter) return false;
      if (dateFilter) {
        if (a.appointment_date !== dateFilter) return false;
      } else {
        // allow showing appointments from the past up to the near future (30 days ahead)
        if (!a.appointment_date) return false;
        if (a.appointment_date > futureCutoff) return false;
      }
      if (
        q &&
        !a.customer_name?.toLowerCase().includes(q) &&
        !a.customer_phone?.toLowerCase().includes(q) &&
        !a.service_name?.toLowerCase().includes(q)
      ) return false;
      return true;
    });
  }, [appointments, statusFilter, dateFilter, search]);

  const filteredSlots = useMemo(() =>
    slots.filter(s => {
      if (slotBarberFilter !== 'All' && s.barber_id !== slotBarberFilter) return false;
      if (s.slot_date !== slotDateFilter) return false;
      return true;
    }), [slots, slotBarberFilter, slotDateFilter]);

  const appointmentPageSize = 10;
  const appointmentPageCount = Math.max(1, Math.ceil(filtered.length / appointmentPageSize));
  const safeAppointmentPage = Math.min(appointmentPage, appointmentPageCount);
  const paginatedAppointments = useMemo(() => {
    const start = (safeAppointmentPage - 1) * appointmentPageSize;
    return filtered.slice(start, start + appointmentPageSize);
  }, [filtered, safeAppointmentPage]);

  const customerPageSize = 10;
  const customerPageCount = Math.max(1, Math.ceil(users.length / customerPageSize));
  const safeCustomerPage = Math.min(customerPage, customerPageCount);
  const paginatedUsers = useMemo(() => {
    const start = (safeCustomerPage - 1) * customerPageSize;
    return users.slice(start, start + customerPageSize);
  }, [users, safeCustomerPage]);

  const emergencyConflicts = useMemo(() => {
    const matchedService = services.find(service => service.name === form.service_name);
    if (!form.appointment_date || !form.appointment_time || !matchedService) return [];

    const start = dateTimeFromParts(form.appointment_date, form.appointment_time).getTime();
    const end = start + Number(matchedService.duration_minutes || 30) * 60000;

    return appointments.filter(appt => {
      if (appt.appointment_date !== form.appointment_date) return false;
      if (form.barber_id && appt.barber_id !== form.barber_id) return false;
      if (['Cancelled', 'Expired'].includes(appointmentDisplayStatus(appt))) return false;

      const apptStart = dateTimeFromParts(appt.appointment_date, appt.appointment_time).getTime();
      const apptEnd = apptStart + Number(services.find(service => service.name === appt.service_name)?.duration_minutes ?? 30) * 60000;
      return start < apptEnd && end > apptStart;
    });
  }, [appointments, form.appointment_date, form.appointment_time, form.barber_id, form.service_name, services]);

  // ── Actions ──
  const updateStatus = async (id: string, status: string) => {
    setEditingId(null);
    await supabase.from('appointments').update({ status }).eq('id', id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: status as Appointment['status'] } : a));
  };

  const deleteAppointment = async (id: string) => {
    if (!confirm('Delete this appointment permanently?')) return;
    await supabase.from('appointments').delete().eq('id', id);
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const deleteSlot = async (id: string) => {
    if (!confirm('Delete this availability window?')) return;
    const { error } = await supabase.from('slots').delete().eq('id', id);
    if (!error) setSlots(prev => prev.filter(s => s.id !== id));
  };

  const toggleSlotAvailability = async (id: string, current: boolean) => {
    const { error } = await supabase.from('slots').update({ is_available: !current }).eq('id', id);
    if (!error) setSlots(prev => prev.map(s => s.id === id ? { ...s, is_available: !current } : s));
  };

  // ── Emergency booking ──
  const patchForm = (patch: Partial<EmergencyForm>) => setForm(f => ({ ...f, ...patch }));

  const submitEmergency = async () => {
  if (!form.customer_name || !form.service_name || !form.appointment_date || !form.appointment_time) {
    setFormError('Customer name, service, date and time are required.'); return;
  }
  setFormError(''); setSubmitting(true);
  try {
    const matchedService = services.find(s => s.name === form.service_name);
    const start_at  = new Date(`${form.appointment_date}T${form.appointment_time}:00`).toISOString();
    const duration  = matchedService?.duration_minutes ?? 30;
    const end_at    = new Date(new Date(start_at).getTime() + duration * 60000).toISOString();
    const overriddenAppointments = emergencyConflicts;

    const payload: any = {
      customer_name:     form.customer_phone
        ? `${form.customer_name.trim()} (${form.customer_phone.trim()})`
        : form.customer_name.trim(),
      service_name:      form.service_name,
      appointment_date:  form.appointment_date,
      appointment_time:  form.appointment_time,
      start_at,
      end_at,
      duration_minutes:  duration,
      barber_id:         form.barber_id || null,
      service_id:        matchedService?.id ?? null,
      status:            'Upcoming',
      revenue:           parseFloat(form.revenue) || matchedService?.price || 0,
      is_emergency:      true,
      // ✅ notes removed — column doesn't exist in your table
    };

    const response = await fetch('/api/admin/emergency-appointment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': getAdminToken() ?? '',
      },
      body: JSON.stringify({
        appointment: payload,
        overrideIds: overriddenAppointments.map(appt => appt.id),
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error ?? 'Unable to create emergency appointment.');
    }

    const barberName = barbers.find(b => b.id === payload.barber_id)?.name ?? '';
    const newAppt: Appointment = {
      id:               result.appointment.id,
      customer_name:    payload.customer_name,
      customer_phone:   form.customer_phone.trim() || null,
      service_name:     payload.service_name,
      service_category: matchedService?.category || 'Other',
      appointment_date: payload.appointment_date,
      appointment_time: payload.appointment_time,
      status:           'Upcoming',
      barber_id:        payload.barber_id,
      is_emergency:     true,
      revenue:          payload.revenue,
      notes:            null, // kept in UI type but not sent to DB
      barbers:          payload.barber_id ? { name: barberName } : null,
    };
    const overriddenIds = new Set(overriddenAppointments.map(appt => appt.id));
    setAppointments(prev => [
      newAppt,
      ...prev.map(appt => overriddenIds.has(appt.id) ? { ...appt, status: 'Cancelled' as const } : appt),
    ]);
    setEmergencyNotice(
      overriddenAppointments.length
        ? `Emergency booking created. Overrode ${overriddenAppointments.length} appointment${overriddenAppointments.length === 1 ? '' : 's'}: ${overriddenAppointments.map(appt => `${appt.customer_name}${appt.customer_phone ? ` (${appt.customer_phone})` : ''} at ${fmtTime(appt.appointment_time)}`).join(', ')}.`
        : 'Emergency booking created. No existing appointments were overridden.',
    );
    setForm(EMPTY_FORM);
    setShowModal(false);
  } catch (err: any) {
    setFormError(err.message ?? 'Something went wrong.');
  } finally {
    setSubmitting(false);
  }
};

  // ── Availability ──
  const patchAvail = (patch: Partial<AvailabilityForm>) => setAvailForm(f => ({ ...f, ...patch }));

  const submitAvailability = async () => {
    if (!availForm.barber_id || !availForm.slot_date || !availForm.from_time || !availForm.to_time) {
      setAvailError('All fields are required.'); return;
    }
    if (availForm.from_time >= availForm.to_time) { setAvailError('End time must be after start time.'); return; }
    const todayStr = new Date().toISOString().split('T')[0];
    if (availForm.slot_date < todayStr) { setAvailError('Cannot set availability for a past date.'); return; }
    if (isPastDateTime(availForm.slot_date, availForm.from_time)) { setAvailError('Start time has already passed for today.'); return; }

    setAvailError(''); setAvailSubmitting(true);
    try {
      const row = {
        barber_id:   availForm.barber_id,
        slot_date:   availForm.slot_date,
        start_time:  availForm.from_time,
        end_time:    availForm.to_time,
        is_available: true,
      };
      const { data, error } = await supabase.from('slots').insert(row).select().single();
      if (error) throw error;
      const barberName = barbers.find(b => b.id === availForm.barber_id)?.name ?? '';
      const newSlot: Slot = { ...data, barbers: { name: barberName } };
      setSlots(prev =>
        [...prev, newSlot].sort((a, b) => a.slot_date.localeCompare(b.slot_date) || a.start_time.localeCompare(b.start_time))
      );
      setAvailForm(EMPTY_AVAILABILITY);
      setShowAvailabilityModal(false);
    } catch (err: any) {
      setAvailError(err.message ?? 'Something went wrong.');
    } finally {
      setAvailSubmitting(false);
    }
  };

  // ── Service CRUD ──
  const patchServiceForm = (patch: Partial<ServiceForm>) => setServiceForm(f => ({ ...f, ...patch }));

  const openAddService = () => {
    setEditingServiceId(null);
    setServiceForm(EMPTY_SERVICE_FORM);
    setServiceError('');
    setShowServiceModal(true);
  };

  const openEditService = (svc: Service) => {
    setEditingServiceId(svc.id);
    setServiceForm({
      name:             svc.name,
      duration_minutes: String(svc.duration_minutes),
      price:            String(svc.price),
      category:         svc.category ?? '',
      description:      svc.description ?? '',
    });
    setServiceError('');
    setShowServiceModal(true);
  };

  const submitService = async () => {
    if (!serviceForm.name || !serviceForm.duration_minutes || !serviceForm.price) {
      setServiceError('Name, duration and price are required.'); return;
    }
    const dur = parseInt(serviceForm.duration_minutes);
    if (isNaN(dur) || dur < 1) { setServiceError('Duration must be at least 1 minute.'); return; }
    const price = parseFloat(serviceForm.price);
    if (isNaN(price) || price < 0) { setServiceError('Please enter a valid price.'); return; }
    setServiceError(''); setServiceSubmitting(true);
    try {
      const payload = {
        name:             serviceForm.name.trim(),
        duration_minutes: dur,
        price,
        category:         serviceForm.category.trim() || null,
        description:      serviceForm.description.trim() || null,
        is_active:        true,
      };

      const response = await fetch('/api/services', {
        method: editingServiceId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken() ?? '',
        },
        body: JSON.stringify(editingServiceId ? { ...payload, id: editingServiceId } : payload),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to save service.');
      }

      const savedService = result as Service;
      if (editingServiceId) {
        setServices(prev => prev.map(s => s.id === editingServiceId ? savedService : s));
      } else {
        setServices(prev => [...prev, savedService].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setShowServiceModal(false);
    } catch (err: any) {
      setServiceError(err.message ?? 'Something went wrong.');
    } finally {
      setServiceSubmitting(false);
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm('Delete this service?')) return;

    try {
      const response = await fetch(`/api/services?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': getAdminToken() ?? '' },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to delete service.');
      }
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      setServiceError(err.message ?? 'Unable to delete service.');
    }
  };

  const toggleServiceActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('services').update({ is_active: !current }).eq('id', id);
    if (!error) setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
  };

  const saveServiceCategory = async (serviceId: string, category: string | null): Promise<boolean> => {
    setCategoryError('');
    setCategorySavingId(serviceId);
    const normalizedCategory = category?.trim() || null;

    try {
      const { data, error } = await supabase
        .from('services')
        .update({ category: normalizedCategory })
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;
      setServices(prev => prev.map(service => service.id === serviceId ? data as Service : service));
      return true;
    } catch (err: any) {
      setCategoryError(err.message ?? 'Unable to update category.');
      return false;
    } finally {
      setCategorySavingId(null);
    }
  };

  const applyCategoryToExistingService = async () => {
    if (!categoryForm.serviceId) {
      setCategoryError('Select an existing service first.');
      return;
    }
    if (!categoryForm.category.trim()) {
      setCategoryError('Enter or choose a category.');
      return;
    }

    const saved = await saveServiceCategory(categoryForm.serviceId, categoryForm.category);
    if (saved) setCategoryForm({ serviceId: '', category: '' });
  };

  const handleLogout = () => { adminLogout(); router.push('/admin/login'); };

  if (!ready) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="relative max-w-7xl mx-auto">

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/3 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-10 right-1/3 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 space-y-8">

          {/* ══ Header ══ */}
          <header className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary">Admin Console</p>
                <h1 className="mt-4 text-4xl font-black text-foreground">Sahil Cutz Command Center</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {fetching && (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" /> Syncing…
                  </span>
                )}
                <button onClick={fetchAll} className="inline-flex items-center gap-2 rounded-3xl border border-border bg-background/90 px-4 py-3 text-sm font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">Admin</span>
                <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-3xl border border-border bg-background/90 px-5 py-3 text-sm font-semibold text-muted-foreground hover:border-red-600/50 hover:text-red-500 transition-all">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          </header>

          {/* ══ Quick Stats ══ */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {([
              { label: 'Total Appointments', value: stats.total,                             icon: Calendar,    color: '#d8b76b' },
              { label: 'Revenue (PKR)',       value: `PKR ${stats.revenue.toLocaleString()}`, icon: BarChart3,   color: '#f0c85a' },
              { label: 'Registered Users',   value: stats.customers,                         icon: Users,       color: '#b58322' },
              { label: 'Emergency Bookings', value: stats.emergency,                         icon: ShieldCheck, color: '#ecb12c' },
            ] as const).map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="rounded-[32px] border border-border bg-background/90 p-6 shadow-sm">
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

            {/* ══ Analytics Date Range Filter ══ */}
            <div className="mt-6 flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Analytics range:</label>
              <input className={INPUT_CLS + ' max-w-[160px]'} type="date" value={analyticsStartDate} onChange={e => setAnalyticsStartDate(e.target.value)} />
              <span className="text-sm text-muted-foreground">—</span>
              <input className={INPUT_CLS + ' max-w-[160px]'} type="date" value={analyticsEndDate} onChange={e => setAnalyticsEndDate(e.target.value)} />
              <button onClick={() => { setAnalyticsStartDate(''); setAnalyticsEndDate(''); }} className="ml-2 inline-flex items-center gap-2 rounded-3xl border border-border bg-background/90 px-3 py-2 text-sm font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">Reset</button>
            </div>

          <section className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary">Appointment summary</p>
                <h2 className="mt-3 text-2xl font-black text-foreground">Today’s bookings or any selected range</h2>
                <p className="mt-1 text-sm text-muted-foreground">Choose a single day or a start/end date to see how many appointments were booked and what status they’re in.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => { setSummaryMode('day'); setSummaryDate(localDateKey()); setSummaryStartDate(localDateKey()); setSummaryEndDate(localDateKey()); }} className="rounded-2xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:border-primary/40 transition-colors">Today</button>
                <button onClick={() => { setSummaryMode('range'); setSummaryStartDate(''); setSummaryEndDate(''); }} className="rounded-2xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:border-primary/40 transition-colors">Date range</button>
                {summaryMode === 'day' ? (
                  <input type="date" value={summaryDate} onChange={e => setSummaryDate(e.target.value)} className={INPUT_CLS + ' max-w-[180px]'} />
                ) : (
                  <>
                    <input type="date" value={summaryStartDate} onChange={e => setSummaryStartDate(e.target.value)} className={INPUT_CLS + ' max-w-[180px]'} />
                    <span className="text-sm text-muted-foreground">to</span>
                    <input type="date" value={summaryEndDate} onChange={e => setSummaryEndDate(e.target.value)} className={INPUT_CLS + ' max-w-[180px]'} />
                  </>
                )}
                <button onClick={() => { setSummaryMode('day'); setSummaryDate(localDateKey()); setSummaryStartDate(localDateKey()); setSummaryEndDate(localDateKey()); }} className="rounded-2xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">Reset</button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-5">
              {[
                { label: 'Total', value: summaryCounts.total, color: '#d8b76b' },
                { label: 'Completed', value: summaryCounts.completed, color: '#4ade80' },
                { label: 'Upcoming / In Progress', value: summaryCounts.upcoming, color: '#f0c85a' },
                { label: 'Cancelled', value: summaryCounts.cancelled, color: '#f87171' },
                { label: 'Payment', value: `PKR ${summaryRevenue.toLocaleString()}`, color: '#38bdf8' },
              ].map(item => (
                <div key={item.label} className="rounded-[24px] border border-border bg-background/90 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{item.label}</p>
                  <p className="mt-3 text-3xl font-black text-foreground" style={{ color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{summaryCounts.total}</span> appointment{summaryCounts.total === 1 ? '' : 's'} and <span className="font-semibold text-foreground">PKR {summaryRevenue.toLocaleString()}</span> in payments for <span className="font-semibold text-foreground">{summaryMode === 'day' ? fmtDate(summaryDate) : `${summaryStartDate ? fmtDate(summaryStartDate) : 'any start date'} → ${summaryEndDate ? fmtDate(summaryEndDate) : 'any end date'}`}</span>.
            </p>
          </section>

          {/* ══ Charts ══ */}
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.35em] text-primary">Booking Analytics</p>
              <h2 className="mt-3 text-2xl font-black text-foreground">Daily bookings &amp; revenue</h2>
              <div className="mt-8 h-[330px]">
                {bookingTrend.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bookingTrend} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="day" stroke="#a69d87" />
                      <YAxis stroke="#a69d87" />
                      <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(216,183,107,0.25)' }} />
                      <Line type="monotone" dataKey="bookings" stroke="#d8b76b" strokeWidth={4} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="revenue"  stroke="#f0c85a" strokeWidth={4} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No appointment data yet</div>
                )}
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.35em] text-primary">Service popularity</p>
                <h2 className="mt-3 text-2xl font-black text-foreground">Category performance</h2>
                <div className="mt-8 h-[220px]">
                  {servicePopularity.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={servicePopularity} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={4}>
                          {servicePopularity.map((e, i) => <Cell key={e.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(216,183,107,0.25)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data yet</div>
                  )}
                </div>
              </div>

              {/* <div className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.35em] text-primary">Actions</p>
                <div className="mt-6 grid gap-4">
                  {([
                    { label: 'Add / edit services',      desc: 'Set name, duration (minutes) and PKR price.',  icon: Scissors,      action: () => openAddService() },
                    { label: 'Set availability window',  desc: 'Pick a date & working hours.',                 icon: Clock,         action: () => { setAvailForm(EMPTY_AVAILABILITY); setAvailError(''); setShowAvailabilityModal(true); } },
                    { label: 'Insert emergency booking', desc: 'Override the timeline with an urgent walk-in.', icon: AlertTriangle, action: () => setShowModal(true) },
                    { label: 'Review analytics',         desc: 'Service popularity, peak hours, revenue.',      icon: Sparkles,      action: undefined },
                  ] as const).map(item => (
                    <div key={item.label} onClick={item.action}
                      className={`rounded-3xl border border-border bg-background/90 p-4 hover:border-primary/40 transition-colors ${item.action ? 'cursor-pointer' : ''}`}>
                      <item.icon className="w-5 h-5 text-primary" />
                      <p className="mt-3 font-semibold text-foreground">{item.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div> */}
            </aside>
          </div>

          {/* ══ Services Table ══ */}
          <section className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary">Service catalogue</p>
                <h2 className="mt-3 text-2xl font-black text-foreground">Services you offer</h2>
                <p className="mt-1 text-sm text-muted-foreground">Customers can book any service within the availability window you set.</p>
              </div>
              <button onClick={openAddService} className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 whitespace-nowrap">
                <Plus className="w-4 h-4" /> Add Service
              </button>
            </div>
            <datalist id="service-category-options">
              {serviceCategories.map(category => <option key={category} value={category} />)}
            </datalist>
            <div className="mt-6 border-y border-border py-5">
              <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                <Field label="Existing service">
                  <select
                    value={categoryForm.serviceId}
                    onChange={e => setCategoryForm(form => ({ ...form, serviceId: e.target.value }))}
                    className={INPUT_CLS}
                  >
                    <option value="">Select service</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Category">
                  <input
                    list="service-category-options"
                    value={categoryForm.category}
                    onChange={e => setCategoryForm(form => ({ ...form, category: e.target.value }))}
                    placeholder="Select or type a category"
                    className={INPUT_CLS}
                  />
                </Field>
                <button
                  onClick={applyCategoryToExistingService}
                  disabled={!categoryForm.serviceId || !categoryForm.category.trim() || categorySavingId === categoryForm.serviceId}
                  className="inline-flex items-center justify-center gap-2 rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60"
                >
                  {categorySavingId === categoryForm.serviceId ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Apply Category
                </button>
              </div>
              {categoryError && <p className="mt-3 text-sm text-red-400">{categoryError}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {serviceCategories.map(category => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setCategoryForm(form => ({ ...form, category }))}
                    className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-muted-foreground">
                <thead className="border-b border-border text-xs uppercase tracking-[0.25em]">
                  <tr>{['Service', 'Category', 'Duration', 'Price (PKR)', 'Status', ''].map(h => <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {!services.length && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">{fetching ? 'Loading…' : 'No services yet.'}</td></tr>
                  )}
                  {services.map(svc => (
                    <tr key={svc.id} className="hover:bg-background/80 transition-colors">
                      <td className="px-4 py-4">
                        <p className="font-semibold">{svc.name}</p>
                        {svc.description && <p className="text-xs text-muted-foreground mt-0.5">{svc.description}</p>}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <select
                          value={svc.category ?? ''}
                          onChange={e => saveServiceCategory(svc.id, e.target.value)}
                          disabled={categorySavingId === svc.id}
                          className="min-w-36 rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary focus:outline-none focus:border-primary/50 disabled:opacity-60"
                        >
                          <option value="">No category</option>
                          {serviceCategories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5"><Timer className="w-3.5 h-3.5 text-primary" />{svc.duration_minutes} min</span>
                      </td>
                      <td className="px-4 py-4 font-bold whitespace-nowrap">PKR {Number(svc.price).toLocaleString()}</td>
                      <td className="px-4 py-4">
                        <button onClick={() => toggleServiceActive(svc.id, svc.is_active)}
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer hover:opacity-70 transition-opacity whitespace-nowrap ${svc.is_active ? 'text-green-400 bg-green-400/10 border-green-400/20' : 'text-muted-foreground bg-border/30 border-border'}`}>
                          {svc.is_active ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditService(svc)} className="rounded-xl border border-primary/20 p-2 text-primary hover:bg-primary/10 transition-colors"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => deleteService(svc.id)} className="rounded-xl border border-red-500/20 p-2 text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ══ Appointments table ══ */}
          <section className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary">Appointment feed</p>
                <h2 className="mt-3 text-2xl font-black text-foreground">Manage every booking</h2>
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Showing past and today by default. Pick a date to view a specific day or future appointments.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input value={search} onChange={e => { setSearch(e.target.value); setAppointmentPage(1); }} placeholder="Search name or service…"
                  className="rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 w-52" />
                <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setAppointmentPage(1); }}
                  className="rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setAppointmentPage(1); }}
                  className="rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50">
                  <option value="All">All statuses</option>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                {(statusFilter !== 'All' || dateFilter || search) && (
                  <button onClick={() => { setStatusFilter('All'); setDateFilter(''); setSearch(''); setAppointmentPage(1); }}
                    className="rounded-2xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">Clear</button>
                )}
                <button onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20">
                  <Plus className="w-4 h-4" /> Emergency Booking
                </button>
              </div>
            </div>

            {emergencyNotice && (
              <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <div className="flex items-start justify-between gap-4">
                  <p>{emergencyNotice}</p>
                  <button onClick={() => setEmergencyNotice('')} className="text-xs font-semibold text-red-200 hover:text-white">Dismiss</button>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{paginatedAppointments.length}</span> of <span className="font-semibold text-foreground">{filtered.length}</span> appointments for <span className="font-semibold text-foreground">{dateFilter ? fmtDate(dateFilter) : 'past and today'}</span>
              </p>
              <div className="flex items-center justify-center gap-5">
                <button
                  onClick={() => setAppointmentPage(page => Math.max(1, page - 1))}
                  disabled={safeAppointmentPage === 1}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:border-primary/40 disabled:opacity-40"
                  aria-label="Previous appointments page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="min-w-16 text-center text-base font-black text-foreground">
                  {safeAppointmentPage} / {appointmentPageCount}
                </span>
                <button
                  onClick={() => setAppointmentPage(page => Math.min(appointmentPageCount, page + 1))}
                  disabled={safeAppointmentPage === appointmentPageCount}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:border-primary/40 disabled:opacity-40"
                  aria-label="Next appointments page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-muted-foreground">
                <thead className="border-b border-border text-xs uppercase tracking-[0.25em]">
                  <tr>{['Customer', 'Service', 'Barber', 'Date', 'Time', 'Status', 'Revenue (PKR)', ''].map(h => <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {!filtered.length && (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">{fetching ? 'Loading…' : 'No appointments match your filters.'}</td></tr>
                  )}
                  {paginatedAppointments.map(item => {
                    const status = appointmentDisplayStatus(item);
                    return (
                    <tr key={item.id} className="hover:bg-background/80 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold whitespace-nowrap">{item.customer_name}</span>
                          {item.is_emergency && (
                            <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold uppercase text-red-400">EMERGENCY</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.customer_phone || 'No phone number'}</p>
                        {item.notes && <p className="text-xs text-muted-foreground mt-0.5 max-w-[160px] truncate" title={item.notes}>{item.notes}</p>}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">{item.service_name}</td>
                      <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{item.barbers?.name || '—'}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{fmtDate(item.appointment_date)}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{fmtTime(item.appointment_time)}</td>
                      <td className="px-4 py-4">
                        {editingId === item.id ? (
                          <select autoFocus defaultValue={item.status}
                            onBlur={e => updateStatus(item.id, e.target.value)}
                            onChange={e => updateStatus(item.id, e.target.value)}
                            className="rounded-xl border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none">
                            {STATUSES.map(s => <option key={s}>{s}</option>)}
                          </select>
                        ) : (
                          <span onClick={() => setEditingId(item.id)} title="Click to change status"
                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer hover:opacity-70 transition-opacity whitespace-nowrap ${STATUS_TEXT[status] ?? 'text-foreground'} ${STATUS_BG[status] ?? 'bg-border/30 border-border'}`}>
                            {status}<Edit3 className="w-3 h-3 opacity-40" />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 font-bold whitespace-nowrap">PKR {Number(item.revenue).toLocaleString()}</td>
                      <td className="px-4 py-4">
                        <button onClick={() => deleteAppointment(item.id)} className="rounded-xl border border-red-500/20 p-2 text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ══ Availability Windows ══ */}
          <section className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary">Availability</p>
                <h2 className="mt-3 text-2xl font-black text-foreground">Working hours</h2>
                <p className="mt-1 text-sm text-muted-foreground">Today is shown by default. Pick a future date to set or review upcoming windows.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select value={slotBarberFilter} onChange={e => setSlotBarberFilter(e.target.value)}
                  className="rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50">
                  <option value="All">All barbers</option>
                  {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <input type="date" value={slotDateFilter} onChange={e => setSlotDateFilter(e.target.value)}
                  className="rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                {(slotBarberFilter !== 'All' || slotDateFilter !== localDateKey()) && (
                  <button onClick={() => { setSlotBarberFilter('All'); setSlotDateFilter(localDateKey()); }}
                    className="rounded-2xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">Clear</button>
                )}
                <button onClick={() => { setAvailForm(EMPTY_AVAILABILITY); setAvailError(''); setShowAvailabilityModal(true); }}
                  className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20">
                  <Plus className="w-4 h-4" /> Set Availability
                </button>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredSlots.length}</span> windows for <span className="font-semibold text-foreground">{fmtDate(slotDateFilter)}</span>
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-muted-foreground">
                <thead className="border-b border-border text-xs uppercase tracking-[0.25em]">
                  <tr>{['Barber', 'Date', 'From', 'To', 'Duration', 'Status', ''].map(h => <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {!filteredSlots.length && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">{fetching ? 'Loading…' : 'No availability set.'}</td></tr>
                  )}
                  {filteredSlots.map(slot => {
                    const [fh, fm] = slot.start_time.split(':').map(Number);
                    const [th, tm] = slot.end_time.split(':').map(Number);
                    const totalMins = (th * 60 + tm) - (fh * 60 + fm);
                    const hrs = Math.floor(totalMins / 60), mins = totalMins % 60;
                    const durationLabel = hrs > 0 ? `${hrs}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`;
                    const slotExpired = isSlotExpired(slot);
                    return (
                      <tr key={slot.id} className="hover:bg-background/80 transition-colors">
                        <td className="px-4 py-4 font-semibold whitespace-nowrap">
                          {slot.barbers?.name ?? barbers.find(b => b.id === slot.barber_id)?.name ?? '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">{fmtDate(slot.slot_date)}</td>
                        <td className="px-4 py-4 whitespace-nowrap font-medium">{fmtTime(slot.start_time)}</td>
                        <td className="px-4 py-4 whitespace-nowrap font-medium">{fmtTime(slot.end_time)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-primary" />{durationLabel}</span>
                        </td>
                        <td className="px-4 py-4">
                          {slotExpired ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-border/30 px-3 py-1 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                              Expired
                            </span>
                          ) : (
                            <button onClick={() => toggleSlotAvailability(slot.id, slot.is_available)}
                              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer hover:opacity-70 transition-opacity whitespace-nowrap ${slot.is_available ? 'text-green-400 bg-green-400/10 border-green-400/20' : 'text-muted-foreground bg-border/30 border-border'}`}>
                              {slot.is_available ? 'Open' : 'Blocked'}<Edit3 className="w-3 h-3 opacity-40" />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <button onClick={() => deleteSlot(slot.id)} className="rounded-xl border border-red-500/20 p-2 text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ══ Unavailability & Off Days Manager ══ */}
          <section className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.35em] text-primary">Unavailability Control</p>
              <h2 className="text-2xl font-black text-foreground">Select Days of Unavailability</h2>
              <p className="text-sm text-muted-foreground">
                Configure weekly off-days or specific blocked dates when customers cannot view or book appointment slots.
              </p>
            </div>

            <div className="mt-6 space-y-6">
              {/* Barber Selector */}
              {barbers.length > 1 && (
                <div>
                  <label className="block text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Select Barber</label>
                  <select
                    value={unavailBarberId}
                    onChange={(e) => setUnavailBarberId(e.target.value)}
                    className="rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  >
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Weekly Off Days */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Weekly Off-Days</h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    { short: 'Sun', full: 'Sunday' },
                    { short: 'Mon', full: 'Monday' },
                    { short: 'Tue', full: 'Tuesday' },
                    { short: 'Wed', full: 'Wednesday' },
                    { short: 'Thu', full: 'Thursday' },
                    { short: 'Fri', full: 'Friday' },
                    { short: 'Sat', full: 'Saturday' },
                  ].map((dayObj) => {
                    const isSelected = selectedOffDays.some(
                      (d) => d.toLowerCase() === dayObj.short.toLowerCase() || d.toLowerCase() === dayObj.full.toLowerCase()
                    );
                    return (
                      <button
                        key={dayObj.short}
                        type="button"
                        onClick={() => toggleOffDay(dayObj.short)}
                        className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-md'
                            : 'bg-background border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {dayObj.full} {isSelected ? '(OFF)' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specific Unavailable Dates */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Block Specific Dates</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="date"
                    min={localDateKey()}
                    value={newBlockedDate}
                    onChange={(e) => setNewBlockedDate(e.target.value)}
                    className="rounded-2xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                  <button
                    type="button"
                    onClick={addBlockedDate}
                    disabled={!newBlockedDate}
                    className="rounded-2xl bg-primary/20 border border-primary/40 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/30 transition-all disabled:opacity-40"
                  >
                    + Add Date to Unavailability
                  </button>
                </div>

                {/* Blocked Dates List */}
                {blockedDates.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {blockedDates.map((dateStr) => (
                      <span
                        key={dateStr}
                        className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400"
                      >
                        📅 {fmtDate(dateStr)}
                        <button
                          type="button"
                          onClick={() => removeBlockedDate(dateStr)}
                          className="hover:text-red-200 transition-colors ml-1 font-bold"
                          title="Unblock date"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Feedback message */}
              {unavailMessage && (
                <div
                  className={`p-4 rounded-2xl text-xs font-semibold ${
                    unavailMessage.startsWith('✅')
                      ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}
                >
                  {unavailMessage}
                </div>
              )}

              {/* Save button */}
              <div>
                <button
                  type="button"
                  onClick={saveUnavailabilitySettings}
                  disabled={unavailSaving}
                  className="rounded-3xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {unavailSaving ? 'Saving Settings...' : 'Save Unavailability Settings'}
                </button>
              </div>
            </div>
          </section>

          {/* ══ Registered Users ══ */}
          <section className="rounded-[32px] border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary">User registry</p>
                <h2 className="mt-3 text-2xl font-black text-foreground">Registered customers</h2>
                <p className="mt-1 text-sm text-muted-foreground">Showing the latest 10 customers per page with name and phone.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <button
                  onClick={() => setCustomerPage(page => Math.max(1, page - 1))}
                  disabled={safeCustomerPage === 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-foreground disabled:opacity-40"
                  aria-label="Previous customers page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="min-w-20 text-center font-semibold text-foreground">
                  {safeCustomerPage} / {customerPageCount}
                </span>
                <button
                  onClick={() => setCustomerPage(page => Math.min(customerPageCount, page + 1))}
                  disabled={safeCustomerPage === customerPageCount}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-foreground disabled:opacity-40"
                  aria-label="Next customers page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-muted-foreground">
                <thead className="border-b border-border text-xs uppercase tracking-[0.25em]">
                  <tr>{['Name', 'Email', 'Phone', 'Joined'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {!users.length && (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">{fetching ? 'Loading…' : 'No users yet.'}</td></tr>
                  )}
                  {paginatedUsers.map(u => (
                    <tr key={u.id} className="hover:bg-background/80 transition-colors">
                      <td className="px-4 py-4">
                        <p className="font-semibold">{u.name || 'Unnamed customer'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{u.phone ?? 'No phone number'}</p>
                      </td>
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

      {/* ══ Service Modal ══ */}
      <AnimatePresence>
        {showServiceModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowServiceModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative z-10 w-full max-w-lg rounded-[32px] border border-border bg-card/95 p-8 shadow-2xl backdrop-blur-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                    <Scissors className="w-3 h-3" /> {editingServiceId ? 'Edit' : 'New'} Service
                  </span>
                  <h2 className="mt-4 text-2xl font-black text-foreground">{editingServiceId ? 'Update service' : 'Add a service'}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Duration defines how long the appointment lasts.</p>
                </div>
                <button onClick={() => setShowServiceModal(false)} className="rounded-2xl border border-border p-2 text-muted-foreground hover:text-foreground transition-all"><X className="w-5 h-5" /></button>
              </div>
              {serviceError && <p className="mt-4 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{serviceError}</p>}
              <div className="mt-6 space-y-4">
                <Field label="Service Name" required>
                  <input value={serviceForm.name} onChange={e => patchServiceForm({ name: e.target.value })} placeholder="e.g. Hair Cut" className={INPUT_CLS} />
                </Field>
                <Field label="Category">
                  <input
                    list="service-category-options"
                    value={serviceForm.category}
                    onChange={e => patchServiceForm({ category: e.target.value })}
                    placeholder="Select or type a category"
                    className={INPUT_CLS}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {serviceCategories.map(category => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => patchServiceForm({ category })}
                        className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Duration (minutes)" required>
                    <input type="number" min="1" step="1" value={serviceForm.duration_minutes} onChange={e => patchServiceForm({ duration_minutes: e.target.value })} placeholder="e.g. 30" className={INPUT_CLS} />
                  </Field>
                  <Field label="Price (PKR)" required>
                    <input type="number" min="0" step="1" value={serviceForm.price} onChange={e => patchServiceForm({ price: e.target.value })} placeholder="e.g. 500" className={INPUT_CLS} />
                  </Field>
                </div>
                {Number(serviceForm.duration_minutes) > 0 && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                    A <span className="font-semibold">{serviceForm.duration_minutes}-minute</span> slot will be reserved when a customer books this service.
                  </div>
                )}
                <Field label="Description (optional)">
                  <textarea value={serviceForm.description} onChange={e => patchServiceForm({ description: e.target.value })} rows={2} placeholder="Brief description…" className={`${INPUT_CLS} resize-none`} />
                </Field>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowServiceModal(false)} className="flex-1 rounded-3xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all">Cancel</button>
                <button onClick={submitService} disabled={serviceSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60 transition-all">
                  {serviceSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><CheckCircle className="w-4 h-4" /> {editingServiceId ? 'Save Changes' : 'Add Service'}</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Availability Modal ══ */}
      <AnimatePresence>
        {showAvailabilityModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAvailabilityModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative z-10 w-full max-w-lg rounded-[32px] border border-border bg-card/95 p-8 shadow-2xl backdrop-blur-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                    <Clock className="w-3 h-3" /> Availability
                  </span>
                  <h2 className="mt-4 text-2xl font-black text-foreground">Set working hours</h2>
                  <p className="mt-1 text-sm text-muted-foreground">By default, the system opens 09:00–18:00 for each day. The last two days of the month stay closed unless you add a custom availability window.</p>
                </div>
                <button onClick={() => setShowAvailabilityModal(false)} className="rounded-2xl border border-border p-2 text-muted-foreground hover:text-foreground transition-all"><X className="w-5 h-5" /></button>
              </div>
              {availError && <p className="mt-4 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{availError}</p>}
              <div className="mt-6 space-y-4">
                <Field label="Barber" required>
                  <select value={availForm.barber_id} onChange={e => patchAvail({ barber_id: e.target.value })} className={INPUT_CLS}>
                    <option value="">— Select barber —</option>
                    {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </Field>
                <Field label="Date" required>
                  <input type="date" value={availForm.slot_date} min={new Date().toISOString().split('T')[0]} onChange={e => patchAvail({ slot_date: e.target.value })} className={INPUT_CLS} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Available from" required>
                    <input type="time" value={availForm.from_time} onChange={e => patchAvail({ from_time: e.target.value })} className={INPUT_CLS} />
                  </Field>
                  <Field label="Available until" required>
                    <input type="time" value={availForm.to_time} onChange={e => patchAvail({ to_time: e.target.value })} className={INPUT_CLS} />
                  </Field>
                </div>
                {availForm.from_time && availForm.to_time && availForm.from_time < availForm.to_time && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">Window summary</p>
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{fmtTime(availForm.from_time)}</span>{' → '}
                      <span className="font-semibold">{fmtTime(availForm.to_time)}</span>
                    </p>
                    {services.filter(s => s.is_active).length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-muted-foreground">Appointments that fit per service:</p>
                        {services.filter(s => s.is_active).map(svc => {
                          const cap = windowCapacity(availForm.from_time, availForm.to_time, svc.duration_minutes);
                          return (
                            <div key={svc.id} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{svc.name} ({svc.duration_minutes} min)</span>
                              <span className="font-semibold text-primary">up to {cap} booking{cap !== 1 ? 's' : ''}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowAvailabilityModal(false)} className="flex-1 rounded-3xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all">Cancel</button>
                <button onClick={submitAvailability}
                  disabled={availSubmitting || !availForm.from_time || !availForm.to_time || availForm.from_time >= availForm.to_time}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60 transition-all">
                  {availSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><CheckCircle className="w-4 h-4" /> Save Availability</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Emergency Booking Modal ══ */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative z-10 w-full max-w-lg rounded-[32px] border border-border bg-card/95 p-8 shadow-2xl backdrop-blur-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-400">
                    <AlertTriangle className="w-3 h-3" /> Emergency
                  </span>
                  <h2 className="mt-4 text-2xl font-black text-foreground">Override Booking</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Insert a high-priority walk-in.</p>
                </div>
                <button onClick={() => setShowModal(false)} className="rounded-2xl border border-border p-2 text-muted-foreground hover:text-foreground transition-all"><X className="w-5 h-5" /></button>
              </div>
              {formError && <p className="mt-4 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{formError}</p>}
              <div className="mt-6 space-y-4">
                <Field label="Customer Name" required>
                  <input value={form.customer_name} onChange={e => patchForm({ customer_name: e.target.value })} placeholder="e.g. Ahmed Khan" className={INPUT_CLS} />
                </Field>
                <Field label="Phone">
                  <input value={form.customer_phone} onChange={e => patchForm({ customer_phone: e.target.value })} placeholder="+92 300 000 0000" className={INPUT_CLS} />
                </Field>
                <Field label="Service" required>
                  <select value={form.service_name} onChange={e => patchForm({ service_name: e.target.value })} className={INPUT_CLS}>
                    <option value="">— Select service —</option>
                    {services.filter(s => s.is_active).map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.duration_minutes} min — PKR {Number(s.price).toLocaleString()})</option>
                    ))}
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
                {emergencyConflicts.length > 0 && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-red-300">
                      This emergency will override {emergencyConflicts.length} appointment{emergencyConflicts.length === 1 ? '' : 's'}
                    </p>
                    <div className="mt-3 space-y-2">
                      {emergencyConflicts.map(appt => (
                        <div key={appt.id} className="rounded-xl border border-red-500/10 bg-background/60 px-3 py-2 text-xs">
                          <p className="font-semibold text-foreground">
                            {appt.customer_name}{appt.customer_phone ? ` (${appt.customer_phone})` : ''}
                          </p>
                          <p className="mt-0.5 text-muted-foreground">
                            {appt.service_name} at {fmtTime(appt.appointment_time)} with {appt.barbers?.name || 'any barber'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Field label="Revenue (PKR)">
                  <input type="number" min="0" step="1" value={form.revenue} onChange={e => patchForm({ revenue: e.target.value })} placeholder="500" className={INPUT_CLS} />
                </Field>
                <Field label="Notes / Reason">
                  <textarea value={form.notes} onChange={e => patchForm({ notes: e.target.value })} rows={2} placeholder="Reason for emergency…" className={`${INPUT_CLS} resize-none`} />
                </Field>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 rounded-3xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all">Cancel</button>
                <button onClick={submitEmergency} disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60 transition-all">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking…</> : <><CheckCircle className="w-4 h-4" /> {emergencyConflicts.length ? `Confirm & Override ${emergencyConflicts.length}` : 'Confirm Booking'}</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
