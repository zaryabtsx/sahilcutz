'use client';

import React from 'react';
import { motion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function PremiumCard({ children, className = '', hover = true, onClick }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02 } : {}}
      onClick={onClick}
      className={`rounded-3xl border border-border bg-card/50 backdrop-blur-sm p-6 transition-all ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
  color?: string;
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  trendPositive = true,
  color = 'bg-gradient-to-br from-primary to-accent',
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-3xl border border-border bg-card/50 backdrop-blur-sm p-6 flex items-center justify-between"
    >
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {trend && (
          <p
            className={`text-xs flex items-center gap-1 ${
              trendPositive ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {trendPositive ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-2xl ${color}`}>
        {icon}
      </div>
    </motion.div>
  );
}

interface AppointmentCardProps {
  customer: string;
  service: string;
  time: string;
  status: 'completed' | 'confirmed' | 'pending' | 'emergency';
  price: number;
  emergency?: boolean;
  onAction?: () => void;
}

export function AppointmentCard({
  customer,
  service,
  time,
  status,
  price,
  emergency = false,
  onAction,
}: AppointmentCardProps) {
  const statusStyles = {
    completed: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-700',
    confirmed: 'bg-blue-500/20 border-blue-500/50 text-blue-700',
    pending: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-700',
    emergency: 'bg-orange-500/20 border-orange-500/50 text-orange-700',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onAction}
      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
        statusStyles[status]
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{customer}</h3>
          <p className="text-sm text-muted-foreground">{service}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-foreground">${price}</p>
          <p className="text-xs text-muted-foreground">{time}</p>
        </div>
      </div>
      {emergency && (
        <div className="mt-2 inline-block px-2 py-1 bg-orange-500 text-white text-xs rounded font-medium">
          EMERGENCY
        </div>
      )}
    </motion.div>
  );
}

interface GlassmorphCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassmorphCard({ children, className = '' }: GlassmorphCardProps) {
  return (
    <div
      className={`rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
}
