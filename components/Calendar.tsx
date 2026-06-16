/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Clock, User, DollarSign } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  customer: string;
  price: number;
  status: 'completed' | 'confirmed' | 'pending' | 'emergency';
  emergency?: boolean;
}

interface CalendarProps {
  events?: CalendarEvent[];
  viewType?: 'day' | 'week' | 'month';
  onDateChange?: (date: Date) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-700';
    case 'confirmed':
      return 'bg-blue-500/20 border-blue-500/50 text-blue-700';
    case 'pending':
      return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-700';
    case 'emergency':
      return 'bg-orange-500/20 border-orange-500/50 text-orange-700';
    default:
      return 'bg-gray-500/20 border-gray-500/50 text-gray-700';
  }
};

export function Calendar({
  events = [],
  viewType = 'month',
  onDateChange,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState(viewType);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-card rounded-lg transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-card rounded-lg transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="p-2 text-center font-semibold text-muted-foreground text-sm"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="space-y-2">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-2">
              {week.map((day, dayIdx) => {
                const date = day
                  ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                  : null;
                const dateStr = date?.toISOString().split('T')[0];
                const dayEvents = dateStr
                  ? events.filter((e) =>
                    e.time.startsWith(dateStr)
                  )
                  : [];

                return (
                  <motion.div
                    key={`${weekIdx}-${dayIdx}`}
                    whileHover={day ? { scale: 1.05 } : {}}
                    onClick={() => {
                      if (day && date) {
                        onDateChange?.(date);
                      }
                    }}
                    className={`min-h-24 p-2 rounded-lg border transition-all cursor-pointer ${
                      day
                        ? 'border-border hover:border-primary/50 bg-card/50'
                        : 'bg-muted/20 border-transparent'
                    }`}
                  >
                    {day && (
                      <>
                        <p className="font-semibold text-sm text-foreground mb-1">
                          {day}
                        </p>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded border ${getStatusColor(
                                event.status
                              )}`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{dayEvents.length - 2} more
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayEvents = events.filter((e) => e.time.startsWith(dateStr));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {currentDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setCurrentDate(
                  new Date(currentDate.getTime() - 24 * 60 * 60 * 1000)
                )
              }
              className="p-2 hover:bg-card rounded-lg transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() =>
                setCurrentDate(
                  new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
                )
              }
              className="p-2 hover:bg-card rounded-lg transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {dayEvents.length > 0 ? (
            dayEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border ${getStatusColor(event.status)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{event.title}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4" />
                      {event.time}
                    </p>
                  </div>
                  {event.emergency && (
                    <span className="text-xs px-2 py-1 rounded bg-orange-500 text-white font-medium">
                      EMERGENCY
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <p className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {event.customer}
                  </p>
                  <p className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {event.price}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No appointments scheduled for this day
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-3xl border border-border bg-card/50 backdrop-blur-sm p-6">
      <div className="mb-6 flex gap-2">
        {['day', 'week', 'month'].map((v) => (
          <button
            key={v}
            onClick={() => setView(v as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === v
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border hover:border-primary/50'
            }`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {view === 'month' ? renderMonthView() : renderDayView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
