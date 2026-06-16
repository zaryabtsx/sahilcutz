# Sahil Cutzz - Premium Barber Appointment SaaS Platform

A modern, production-ready barber appointment management system built with Next.js, React, TypeScript, Tailwind CSS, and Supabase. Features premium UI/UX, advanced scheduling with emergency override capabilities, and role-based dashboards.

## 🎯 Features

### Authentication System
- **Role-Based Access**: Admin, Barber, Customer roles
- **Secure Sign Up/Login**: Email verification and password reset
- **Session Persistence**: Automatic session management
- **Protected Routes**: Role-based route protection

### Appointment Management
- **Multi-Step Booking Wizard**: Service → Barber → Date → Time → Confirm
- **Real-Time Slot Availability**: Dynamic slot generation based on duration and breaks
- **Emergency Override System**: Intelligently shift existing appointments
- **Appointment Tracking**: Full lifecycle from pending to completed

### Advanced Scheduling Engine
- **Dynamic Slot Generation**: 15-minute intervals with service duration consideration
- **Break Handling**: Automatic break time blocking
- **Buffer Times**: Configurable buffer between appointments
- **Off Days**: Support for barber off days
- **Conflict Prevention**: Automatic detection and prevention of double bookings
- **Shift Tracking**: Complete history of shifted appointments

### Dashboard Systems

#### Admin Dashboard
- Overview cards (Total Appointments, Revenue, Active Customers, Emergency Count)
- Analytics with daily booking trends
- Service popularity charts
- Appointment management and filtering
- Day/Week/Month view toggle

#### Barber Dashboard (Sahil)
- Today's schedule view
- Upcoming appointments
- Emergency booking insertion
- Availability toggle
- Break time management
- Appointment status updates

#### Customer Dashboard
- Upcoming appointments
- Appointment history
- Favorite barber management
- Notification center
- Appointment details and rescheduling

### Service Management
- Service CRUD operations
- Pricing and duration configuration
- Category management
- Image support
- Active/Inactive toggling

### Notifications System
- Booking confirmations
- Appointment reminders
- Reschedule alerts
- Emergency shift notifications
- Real-time notification panel

## 🏗️ Architecture

### Directory Structure
```
sahilcutz/
├── app/
│   ├── api/              # API Routes (Supabase-connected)
│   ├── admin/            # Admin dashboard
│   ├── barber/           # Barber dashboard
│   ├── customer/         # Customer dashboard
│   ├── auth/             # Authentication pages
│   ├── booking-new/      # Booking wizard page
│   └── page.tsx          # Landing page
├── components/
│   ├── auth/             # Auth forms
│   ├── booking/          # Booking wizard
│   ├── ui/               # Reusable UI components
│   ├── Calendar.tsx      # Calendar component
│   ├── NotificationPanel.tsx
│   └── [other components]
├── lib/
│   ├── schedulingEngine.ts    # Advanced scheduling logic
│   ├── seedDatabase.ts        # Database seeding
│   ├── auth.ts               # Authentication functions
│   ├── supabase.ts           # Supabase client
│   ├── types.ts              # TypeScript types
│   ├── utils-helpers.ts      # Utility functions
│   └── [other utilities]
└── public/               # Static files
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/pnpm
- Supabase project (free tier works great)
- Environment variables

### Environment Setup
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit `http://localhost:3000`

## 🗄️ Database Schema

### Users Table
- `id`: UUID (Primary)
- `email`: Text (Unique)
- `full_name`: Text
- `phone`: Text
- `role`: Text ('admin', 'barber', 'customer')
- `favorite_barber_id`: UUID (Foreign Key)
- `created_at`, `updated_at`: Timestamps

### Barbers Table
- `id`: UUID (Primary)
- `name`: Text
- `slug`: Text (Unique)
- `image_url`: Text
- `experience_years`: Integer
- `bio`: Text
- `working_hours`: JSONB (start, end, breaks, off_days)
- `is_available`: Boolean
- `created_at`, `updated_at`: Timestamps

### Services Table
- `id`: UUID (Primary)
- `name`: Text
- `description`: Text
- `price`: Numeric
- `duration_minutes`: Integer
- `category`: Text
- `image_url`: Text
- `is_active`: Boolean
- `buffer_minutes`: Integer (optional)
- `created_at`, `updated_at`: Timestamps

### Appointments Table
- `id`: UUID (Primary)
- `user_id`: UUID (Foreign Key)
- `barber_id`: UUID (Foreign Key)
- `service_id`: UUID (Foreign Key)
- `start_at`, `end_at`: Timestamps
- `duration_minutes`: Integer
- `status`: Text ('pending', 'confirmed', 'completed', 'cancelled', 'emergency', 'shifted')
- `is_emergency`: Boolean
- `shift_source_id`: UUID (Foreign Key, nullable)
- `emergency_override_id`: UUID (Foreign Key, nullable)
- `notes`: Text
- `created_at`, `updated_at`: Timestamps

### Appointment_Shifts Table
- `id`: UUID (Primary)
- `appointment_id`: UUID (Foreign Key)
- `original_start_at`: Timestamp
- `new_start_at`: Timestamp
- `shift_reason`: Text
- `created_at`: Timestamp

### Notifications Table
- `id`: UUID (Primary)
- `user_id`: UUID (Foreign Key)
- `type`: Text ('booking', 'reminder', 'reschedule', 'emergency')
- `message`: Text
- `related_appointment_id`: UUID (Foreign Key, nullable)
- `read`: Boolean
- `created_at`: Timestamp

## 🔌 API Routes

### Appointments
- `GET /api/appointments` - List appointments (with filters)
- `POST /api/appointments` - Create appointment or emergency booking
- `PATCH /api/appointments` - Update appointment

### Services
- `GET /api/services` - List services
- `POST /api/services` - Create service

### Barbers
- `GET /api/barbers` - List barbers
- `POST /api/barbers` - Create barber
- `PATCH /api/barbers` - Update barber

### Slots
- `GET /api/slots` - Get available time slots

### Query Parameters
```
/api/appointments?barberId=xxx&userId=xxx&date=2024-01-01&status=confirmed
/api/services?active=true
/api/slots?barberId=xxx&date=2024-01-01&serviceDuration=30&type=slots|dates
```

## 🎨 Design System

### Color Palette
- **Primary**: #6366f1 (Indigo)
- **Accent**: #f59e0b (Amber)
- **Success**: #10b981 (Emerald)
- **Danger**: #ef4444 (Red)
- **Warning**: #f59e0b (Orange)

### Premium Features
- Glassmorphism effects with backdrop-blur
- Smooth animations with Framer Motion
- Skeleton loaders during data fetching
- Elegant hover states and transitions
- Responsive grid layouts
- Dark mode support

## 📱 Responsive Design
- Mobile-first approach
- Tailwind CSS breakpoints
- Touch-friendly interactions
- Optimized for all screen sizes

## 🔐 Security Features
- Supabase Row-Level Security (RLS)
- JWT token authentication
- Protected API routes
- Input validation with Zod
- HTTPS in production

## 📊 Analytics

### Metrics Tracked
- Daily bookings and revenue
- Service popularity
- Barber performance
- Peak booking hours
- Customer retention
- Emergency override usage

### Data Aggregation
- Real-time dashboard updates
- Weekly trends
- Monthly reports
- Revenue analytics

## 🔄 Emergency Override System

### How It Works
1. Admin/Barber initiates emergency booking
2. System detects conflicting appointments
3. Existing appointments are intelligently shifted to next available slots
4. Appointment shifts are recorded in `appointment_shifts` table
5. Affected customers receive notifications

### Example
```
Original: A (2:00-2:30 PM), B (2:30-3:00 PM)
Emergency: E inserted at 2:00 PM
Result: E (2:00-2:30 PM), A (3:00-3:30 PM), B (3:30-4:00 PM)
```

## 🧪 Testing Data

### Default Admin Account
- Email: `admin@sahilcutzz.com`
- Password: `admin123`
- Role: Admin

### Sample Services
- Classic Haircut: 30 min, $45
- Beard Trim: 20 min, $25
- Hair + Beard Combo: 45 min, $65
- Hot Towel Shave: 40 min, $55
- Hair Coloring: 90 min, $85

### Sample Barber
- Name: Sahil
- Experience: 10 years
- Hours: 9 AM - 6 PM
- Break: 1 PM - 2 PM
- Off Days: Sunday

## 📚 Key Libraries

- **Next.js 16**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Animations
- **Zod**: Schema validation
- **React Hook Form**: Form management
- **Supabase**: Backend & database
- **Recharts**: Analytics charts
- **Zustand**: State management

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Connect your repository
# Set environment variables in Vercel dashboard
# Deploy automatically on push
```

### Docker
```bash
docker build -t sahilcutzz .
docker run -p 3000:3000 -e NEXT_PUBLIC_SUPABASE_URL=xxx sahilcutzz
```

## 🤝 Contributing
Pull requests are welcome. For major changes, please open an issue first.

## 📄 License
MIT

## 🎓 Learning Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Search existing GitHub issues
3. Create a new issue with details

## 🎯 Future Enhancements

- [ ] WhatsApp notifications integration
- [ ] Email reminders (SendGrid integration)
- [ ] SMS notifications (Twilio)
- [ ] Video consultations
- [ ] Customer reviews and ratings
- [ ] Payment processing (Stripe)
- [ ] Multi-barber support UI enhancements
- [ ] Advanced analytics dashboard
- [ ] Staff management
- [ ] Inventory tracking
