import { create } from 'zustand';
import type { AuthSession, BarberProfile, AppointmentItem, ServiceItem, UserProfile } from './types';

interface BookingWizardState {
  step: number;
  serviceId: string | null;
  barberId: string | null;
  date: string;
  timeSlot: string;
  notes: string;
}

interface AppState {
  // Auth
  session: AuthSession | null;
  user: UserProfile | null;
  isLoading: boolean;
  
  // Booking
  booking: BookingWizardState;
  
  // UI
  notificationsOpen: boolean;
  theme: 'light' | 'dark';
  
  // Data Cache
  services: ServiceItem[];
  barbers: BarberProfile[];
  appointments: AppointmentItem[];
  
  // Actions
  setSession: (session: AuthSession | null) => void;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  updateBooking: (data: Partial<BookingWizardState>) => void;
  resetBooking: () => void;
  toggleNotifications: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setServices: (services: ServiceItem[]) => void;
  setBarbers: (barbers: BarberProfile[]) => void;
  setAppointments: (appointments: AppointmentItem[]) => void;
}

const initialBookingState: BookingWizardState = {
  step: 1,
  serviceId: null,
  barberId: null,
  date: '',
  timeSlot: '',
  notes: '',
};

export const useAppStore = create<AppState>((set) => ({
  // Auth
  session: null,
  user: null,
  isLoading: false,
  
  // Booking
  booking: { ...initialBookingState },
  
  // UI
  notificationsOpen: false,
  theme: 'dark',
  
  // Data
  services: [],
  barbers: [],
  appointments: [],
  
  // Actions
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  updateBooking: (data) => set((state) => ({ booking: { ...state.booking, ...data } })),
  resetBooking: () => set({ booking: { ...initialBookingState } }),
  toggleNotifications: () => set((state) => ({ notificationsOpen: !state.notificationsOpen })),
  setTheme: (theme) => set({ theme }),
  setServices: (services) => set({ services }),
  setBarbers: (barbers) => set({ barbers }),
  setAppointments: (appointments) => set({ appointments }),
}));
