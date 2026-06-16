import { create } from 'zustand';
import { AppointmentItem, BarberProfile, ServiceItem } from '@/lib/types';

interface BookingState {
  selectedService: ServiceItem | null;
  selectedBarber: BarberProfile | null;
  selectedDate: string;
  selectedSlot: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  appointmentNotes: string;
  setService: (value: ServiceItem) => void;
  setBarber: (value: BarberProfile) => void;
  setDate: (value: string) => void;
  setSlot: (value: string) => void;
  setCustomerDetails: (data: { fullName: string; email: string; phone: string }) => void;
  setNotes: (notes: string) => void;
  reset: () => void;
  prepareEmergency: (barber: BarberProfile, date: string, slot: string) => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedService: null,
  selectedBarber: null,
  selectedDate: new Date().toISOString().slice(0, 10),
  selectedSlot: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  appointmentNotes: '',
  setService: (value) => set({ selectedService: value }),
  setBarber: (value) => set({ selectedBarber: value }),
  setDate: (value) => set({ selectedDate: value }),
  setSlot: (value) => set({ selectedSlot: value }),
  setCustomerDetails: (data) => set({ customerName: data.fullName, customerEmail: data.email, customerPhone: data.phone }),
  setNotes: (notes) => set({ appointmentNotes: notes }),
  reset: () => set({
    selectedService: null,
    selectedBarber: null,
    selectedDate: new Date().toISOString().slice(0, 10),
    selectedSlot: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    appointmentNotes: '',
  }),
  prepareEmergency: (barber, date, slot) => set({ selectedBarber: barber, selectedDate: date, selectedSlot: slot }),
}));
