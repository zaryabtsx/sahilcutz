/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronRight,
  ChevronLeft,
  Scissors,
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Loader,
  CreditCard,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { useAppStore } from '@/lib/store';
import { initialBarbers, initialServices } from '@/lib/mockData';
import { PaymentStep } from './PaymentStep';
import { getAdvancePaymentAmount } from '@/lib/volzix';
import type { ServiceItem, BarberProfile } from '@/lib/types';

interface BookingWizardProps {
  onComplete?: (booking: any) => void;
}

interface BookingData {
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  notes: string;
}

function isBookingData(value: unknown): value is BookingData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  return ['serviceId', 'barberId', 'date', 'time', 'notes'].every(
    (key) => typeof data[key] === 'string',
  );
}

const steps = [
  { number: 1, title: 'Select Service', icon: Scissors },
  { number: 2, title: 'Choose Barber', icon: User },
  { number: 3, title: 'Pick Date', icon: Calendar },
  { number: 4, title: 'Select Time', icon: Clock },
  { number: 5, title: 'Confirm Booking', icon: CheckCircle },
  { number: 6, title: 'Secure Payment', icon: CreditCard },
];

export function BookingWizard({ onComplete }: BookingWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [barbers, setBarbers] = useState<BarberProfile[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const session = getSession();
  const { setAppointments } = useAppStore();
  const [bookingData, setBookingData] = useState<BookingData>({
    serviceId: '',
    barberId: '',
    date: '',
    time: '',
    notes: '',
  });

  // Check for payment completion from URL params
  useEffect(() => {
    const paymentStatus = searchParams.get('paymentStatus');
    const paymentId = searchParams.get('paymentId');

    // Restore booking data from sessionStorage if payment is returning
    let restoredBookingData: BookingData | null = null;
    const savedBookingData = sessionStorage.getItem('bookingData');
    if (savedBookingData && paymentStatus === 'success') {
      try {
        const parsedBookingData = JSON.parse(savedBookingData);
        if (isBookingData(parsedBookingData)) {
          restoredBookingData = parsedBookingData;
          setBookingData(parsedBookingData);
        }
      } catch (e) {
        console.warn('Failed to restore booking data:', e);
      }
    }

    if (paymentStatus === 'success' && paymentId && restoredBookingData) {
      setPaymentData({ paymentId });
      // Create appointment after payment verification
      setTimeout(() => {
        createAppointmentAfterPayment(paymentId, restoredBookingData!);
      }, 100); // Small delay to ensure state is updated
    } else if (paymentStatus === 'failed') {
      setError('Payment was declined. Please try again.');
      setCurrentStep(6); // Go back to payment step
    }
  }, [searchParams]);

  // Check authentication
  useEffect(() => {
    if (!session) {
      router.push('/auth/login');
    }
  }, [session, router]);

  // Load services
  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await fetch('/api/services');
        if (!res.ok) throw new Error('Failed to fetch services');
        const data = await res.json();
        const servicesArray = Array.isArray(data) ? data : data.services || [];
        setServices(servicesArray);
        if (servicesArray.length > 0 && !bookingData.serviceId) {
          setBookingData((prev) => ({ ...prev, serviceId: servicesArray[0].id }));
        }
      } catch (error) {
        console.error('Failed to load services:', error);
        setError('Unable to load services. Please try again.');
      }
    };
    loadServices();
  }, []);

  // Load barbers
  // useEffect(() => {
  //   const loadBarbers = async () => {
  //     try {
  //       const res = await fetch('/api/barbers');
  //       if (!res.ok) throw new Error('Failed to fetch barbers');
  //       const data = await res.json();
  //       const barbersArray = Array.isArray(data) ? data : data.barbers || [];
  //       setBarbers(barbersArray);
  //       if (barbersArray.length > 0 && !bookingData.barberId) {
  //         setBookingData((prev) => ({ ...prev, barberId: barbersArray[0].id }));
  //       }
  //     } catch (error) {
  //       console.error('Failed to load barbers:', error);
  //       setError('Unable to load barbers. Please try again.');
  //     }
  //   };
  //   loadBarbers();
  // }, []);
  useEffect(() => {
  async function loadBarbers() {
    try {
      const res = await fetch('/api/barbers');
      if (!res.ok) throw new Error('Failed to fetch barbers');
      const data = await res.json();
      const barbersArray = Array.isArray(data) ? data : data.barbers || [];
      setBarbers(barbersArray.length > 0 ? barbersArray : initialBarbers);
    } catch (err) {
      console.warn('API unavailable, using mock barbers:', err);
      setBarbers(initialBarbers); // ← fallback to mock data
    }
  }
  loadBarbers();
}, []);

  // Load available slots when date changes
  useEffect(() => {
    if (bookingData.date && bookingData.serviceId && bookingData.barberId) {
      loadAvailableSlots();
    }
  }, [bookingData.date, bookingData.serviceId, bookingData.barberId]);

  const loadAvailableSlots = async () => {
    setLoading(true);
    setError('');
    try {
      const service = services.find((s) => s.id === bookingData.serviceId);
      if (!service) {
        setError('Service not found');
        return;
      }

      const res = await fetch(
        `/api/slots?barberId=${bookingData.barberId}&date=${bookingData.date}&serviceDuration=${service.duration_minutes}`
      );
      if (!res.ok) throw new Error('Failed to fetch slots');
      const data = await res.json();
      const slots = Array.isArray(data) ? data : data.slots || [];
      setAvailableSlots(slots);
      if (slots.length === 0) {
        setError('No available slots for this date. Please try another date.');
      }
    } catch (error) {
      console.error('Failed to load slots:', error);
      setError('Unable to load available slots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setError('');
    if (!session?.user?.id) {
      setError('Please log in to complete your booking.');
      router.push('/auth/login');
      return;
    }

    // Save booking data to sessionStorage before moving to payment
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    
    // Move to payment step
    handleNext();
  };

  const createAppointmentAfterPayment = async (paymentId?: string, bookingInfo?: BookingData) => {
    setLoading(true);
    setError('');
    try {
      if (!session?.user?.id) {
        setError('Please log in to complete your booking.');
        router.push('/auth/login');
        return;
      }

      const dataToUse = bookingInfo || bookingData;

      const service = services.find((s) => s.id === dataToUse.serviceId);
      if (!service) {
        setError('Service not found');
        return;
      }

      if (!dataToUse.time) {
        setError('Please select a time slot');
        return;
      }

      const startDate = new Date(`${dataToUse.date}T${dataToUse.time}`);
      const endDate = new Date(startDate.getTime() + service.duration_minutes * 60000);

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.user.id,
          barber_id: dataToUse.barberId,
          service_id: dataToUse.serviceId,
          start_at: startDate.toISOString(),
          end_at: endDate.toISOString(),
          duration_minutes: service.duration_minutes,
          notes: dataToUse.notes || null,
          status: 'confirmed',
          payment_id: paymentId || paymentData?.paymentId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create appointment');
      }

      const appointment = await res.json();
      setSuccess(true);
      setAppointments([appointment]); // Update store
      onComplete?.(appointment);
      
      // Clear sessionStorage after successful booking
      sessionStorage.removeItem('bookingData');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to book appointment';
      console.error('Booking error:', error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-20 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Step Indicator */}
        <div className="mb-12">
          <div className="flex justify-between mb-8">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <div key={step.number} className="flex flex-col items-center flex-1">
                  <motion.div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isActive
                        ? 'bg-gradient-to-br from-primary to-accent text-white shadow-lg'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-card border border-border text-muted-foreground'
                    }`}
                    animate={{ scale: isActive ? 1.1 : 1 }}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <StepIcon className="w-6 h-6" />
                    )}
                  </motion.div>
                  <p className={`text-xs text-center font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.title}
                  </p>

                  {idx < steps.length - 1 && (
                    <div
                      className={`absolute w-20 h-1 -z-10 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-border'
                      }`}
                      style={{
                        top: '24px',
                        left: `calc(50% + 24px)`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="rounded-3xl border border-border bg-card/50 backdrop-blur-sm p-8"
        >
          {/* Step 1: Select Service */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Choose Your Service</h2>
                <p className="text-muted-foreground">Select the service that best fits your needs</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <motion.button
                    key={service.id}
                    onClick={() => {
                      setBookingData({ ...bookingData, serviceId: service.id });
                      handleNext();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-6 rounded-2xl border-2 transition-all text-left ${
                      bookingData.serviceId === service.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{service.name}</h3>
                      <span className="text-xl font-bold text-primary">${service.price}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                    <p className="text-xs text-muted-foreground">⏱ {service.duration_minutes} minutes</p>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Choose Barber */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Choose Your Barber</h2>
                <p className="text-muted-foreground">Select from our premium barbers</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {barbers.map((barber) => (
                  <motion.button
                    key={barber.id}
                    onClick={() => {
                      setBookingData({ ...bookingData, barberId: barber.id });
                      handleNext();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-6 rounded-2xl border-2 transition-all text-left ${
                      bookingData.barberId === barber.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {barber.image_url && (
                        <img
                          src={barber.image_url}
                          alt={barber.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-foreground">{barber.name}</h3>
                        <p className="text-sm text-muted-foreground">{barber.experience_years}+ years experience</p>
                      </div>
                    </div>
                    {barber.bio && <p className="text-sm text-muted-foreground">{barber.bio}</p>}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Pick Date */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Select Your Date</h2>
                <p className="text-muted-foreground">Choose a date that works best for you</p>
              </div>

              <input
                type="date"
                min={getMinDate()}
                max={getMaxDate()}
                value={bookingData.date}
                onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-border bg-card text-foreground focus:outline-none focus:border-primary transition-all"
              />
            </div>
          )}

          {/* Step 4: Select Time */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Select Your Time</h2>
                <p className="text-muted-foreground">Available time slots for {bookingData.date}</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Booked times are shown in gray and cannot be selected.
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {availableSlots.map((slot, idx) => {
                      const isBooked = slot.available === false;
                      const isSelected = bookingData.time === slot.start;
                      return (
                        <motion.button
                          key={idx}
                          onClick={() => {
                            if (isBooked) return;
                            setBookingData({ ...bookingData, time: slot.start });
                            handleNext();
                          }}
                          whileHover={!isBooked ? { scale: 1.05 } : undefined}
                          whileTap={!isBooked ? { scale: 0.95 } : undefined}
                          disabled={isBooked}
                          className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                            isBooked
                              ? 'border-border/60 bg-muted/40 text-muted-foreground cursor-not-allowed'
                              : isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border hover:border-primary'
                          }`}
                        >
                          {slot.start}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  No available slots for this date
                </div>
              )}
            </div>
          )}

          {/* Step 5: Confirm Booking */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Confirm Your Booking</h2>
                <p className="text-muted-foreground">Please review your booking details</p>
              </div>

              <div className="space-y-4">
                {services.find((s) => s.id === bookingData.serviceId) && (
                  <div className="p-4 rounded-2xl bg-card border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Service</p>
                    <p className="text-lg font-semibold text-foreground">
                      {services.find((s) => s.id === bookingData.serviceId)?.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      ${services.find((s) => s.id === bookingData.serviceId)?.price}
                    </p>
                  </div>
                )}

                {barbers.find((b) => b.id === bookingData.barberId) && (
                  <div className="p-4 rounded-2xl bg-card border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Barber</p>
                    <p className="text-lg font-semibold text-foreground">
                      {barbers.find((b) => b.id === bookingData.barberId)?.name}
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-card border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
                  <p className="text-lg font-semibold text-foreground">
                    {new Date(`${bookingData.date}T${bookingData.time}`).toLocaleString()}
                  </p>
                </div>

                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  placeholder="Add any special notes or requests..."
                  className="w-full px-4 py-3 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 6: Payment */}
          {currentStep === 6 && session?.user && (
            <PaymentStep
              userId={session.user.id}
              customerEmail={session.user.email || ''}
              customerName={session.user.full_name || session.user.email || 'Guest'}
              customerPhone={session.user.phone || ''}
              serviceId={bookingData.serviceId}
              barberId={bookingData.barberId}
              bookingDate={bookingData.date}
              bookingTime={bookingData.time}
              advanceAmount={getAdvancePaymentAmount(
                services.find((service) => service.id === bookingData.serviceId)?.price,
              )}
              loading={loading}
              onPaymentFailed={(error) => {
                setError(error);
              }}
            />
          )}
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Booking Confirmed!</p>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                Your appointment has been successfully booked. Check your email for confirmation details.
              </p>
            </div>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <AnimatePresence>
          {!success && currentStep !== 6 && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between mt-8"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrev}
                disabled={currentStep === 1 || loading}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-border hover:border-primary disabled:opacity-50 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={currentStep === 5 ? handleComplete : handleNext}
                disabled={
                  (currentStep === 1 && !bookingData.serviceId) ||
                  (currentStep === 2 && !bookingData.barberId) ||
                  (currentStep === 3 && !bookingData.date) ||
                  (currentStep === 4 && !bookingData.time) ||
                  loading
                }
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : currentStep === 5 ? (
                  <>
                    Proceed to Payment
                    <CreditCard className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
