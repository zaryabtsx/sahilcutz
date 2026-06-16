/**
 * Common utility functions for the SaaS platform
 */

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function calculateDuration(
  startTime: string,
  endTime: string
): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

export function addMinutesToDate(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

export function getNextAvailableDate(daysFromNow: number = 1): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(9, 0, 0, 0);
  return date;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^\+?[\d\s\-()]{10,}$/.test(phone);
}

export function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    emergency: 'Emergency',
    shifted: 'Shifted',
  };
  return labels[status] || status;
}

export function getStatusColor(
  status: string
): 'primary' | 'accent' | 'emerald' | 'red' | 'orange' {
  switch (status) {
    case 'confirmed':
      return 'primary';
    case 'completed':
      return 'emerald';
    case 'cancelled':
      return 'red';
    case 'emergency':
      return 'orange';
    default:
      return 'accent';
  }
}

export function calculateRevenueByService(
  appointments: any[],
  services: any[]
): Record<string, number> {
  const revenue: Record<string, number> = {};

  appointments
    .filter((a) => a.status === 'completed')
    .forEach((a) => {
      const service = services.find((s) => s.id === a.service_id);
      if (service) {
        revenue[service.name] = (revenue[service.name] || 0) + service.price;
      }
    });

  return revenue;
}

export function getWeeklyStats(appointments: any[]) {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const weekStats: Record<string, number> = {
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
    Sunday: 0,
  };

  appointments.forEach((a) => {
    const aptDate = new Date(a.start_at);
    if (aptDate >= weekStart && aptDate <= today) {
      const dayName = aptDate.toLocaleDateString('en-US', { weekday: 'long' });
      weekStats[dayName]++;
    }
  });

  return weekStats;
}

export function getDayOfWeek(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long' });
}
