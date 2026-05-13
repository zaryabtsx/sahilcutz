'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { LogOut, BarChart3, Users, Calendar, Settings, ArrowRight } from 'lucide-react';
import { isAdminAuthenticated, clearAdminToken } from '@/lib/auth';

const dashboardStats = [
  { label: 'Total Appointments', value: '1,234', icon: Calendar, color: 'from-primary' },
  { label: 'Customers', value: '856', icon: Users, color: 'from-accent' },
  { label: 'Revenue', value: '$24,580', icon: BarChart3, color: 'from-primary' },
];

const recentAppointments = [
  { id: 1, customer: 'John Doe', service: 'Classic Haircut', date: '2026-05-13', time: '10:00 AM', status: 'Completed' },
  { id: 2, customer: 'Jane Smith', service: 'Beard Trim', date: '2026-05-13', time: '11:30 AM', status: 'In Progress' },
  { id: 3, customer: 'Mike Johnson', service: 'Hot Towel Shave', date: '2026-05-13', time: '02:00 PM', status: 'Upcoming' },
  { id: 4, customer: 'Alex Brown', service: 'Hair Coloring', date: '2026-05-13', time: '03:30 PM', status: 'Upcoming' },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    clearAdminToken();
    router.push('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg font-medium transition-all duration-300 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </motion.button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {dashboardStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-linear-to-br ${stat.color} to-accent rounded-xl flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Recent Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Recent Appointments
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Service</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Date & Time</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-muted/50 transition-colors duration-300">
                    <td className="px-6 py-4 text-sm text-foreground font-medium">{appointment.customer}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{appointment.service}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {appointment.date} at {appointment.time}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          appointment.status === 'Completed'
                            ? 'bg-primary/10 text-primary'
                            : appointment.status === 'In Progress'
                              ? 'bg-accent/10 text-accent'
                              : 'bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <motion.button
                        whileHover={{ x: 2 }}
                        className="text-primary hover:text-accent transition-colors duration-300 flex items-center gap-1"
                      >
                        View <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 cursor-pointer group">
            <Calendar className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform duration-300" />
            <h3 className="text-lg font-bold text-foreground mb-2">Manage Appointments</h3>
            <p className="text-sm text-muted-foreground mb-4">View, edit, or cancel customer appointments</p>
            <button className="text-primary hover:text-accent transition-colors duration-300 flex items-center gap-1 font-medium">
              Go to Appointments <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 cursor-pointer group">
            <Settings className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform duration-300" />
            <h3 className="text-lg font-bold text-foreground mb-2">Settings</h3>
            <p className="text-sm text-muted-foreground mb-4">Configure business hours, services, and more</p>
            <button className="text-primary hover:text-accent transition-colors duration-300 flex items-center gap-1 font-medium">
              Go to Settings <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
