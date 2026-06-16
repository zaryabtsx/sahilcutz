# Development Setup Checklist

## Prerequisites
- [ ] Node.js 18+ installed
- [ ] npm or pnpm available
- [ ] Git configured
- [ ] Code editor (VSCode recommended)

## Step 1: Project Setup
- [ ] Clone repository: `git clone ...`
- [ ] Navigate to project: `cd sahilcutz`
- [ ] Install dependencies: `npm install`
- [ ] Create `.env.local` file

## Step 2: Supabase Configuration

### Create Supabase Project
1. [ ] Go to [supabase.com](https://supabase.com)
2. [ ] Create new project
3. [ ] Wait for project initialization
4. [ ] Go to Project Settings → API

### Get API Keys
- [ ] Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copy `anon (public)` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Setup .env.local
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## Step 3: Database Initialization

### Via Supabase Dashboard
1. [ ] Go to SQL Editor in Supabase
2. [ ] Copy entire schema from `supabase/schema.sql`
3. [ ] Paste and execute

### Via Script (Recommended)
```bash
npm run setup-db
```

## Step 4: Run Development Server
```bash
npm run dev
```

Server running at: `http://localhost:3000`

## Step 5: Verify Installation

### Check Landing Page
- [ ] Visit `http://localhost:3000`
- [ ] Landing page loads
- [ ] Navigation works

### Check Authentication
- [ ] Click "Book Now" button
- [ ] Go to signup/login
- [ ] Test sign up with role selection
- [ ] Test login with credentials

### Check Booking
- [ ] Visit booking page
- [ ] Select service
- [ ] Choose barber
- [ ] Pick date and time
- [ ] Complete booking

### Check Admin Dashboard
- [ ] Login as admin
- [ ] Dashboard loads with analytics
- [ ] View appointments list

## Step 6: Database Seeding

### Automatic (Recommended)
```bash
npm run seed
```

### Manual
1. [ ] Run SQL from `supabase/schema.sql`
2. [ ] Insert seed data from `lib/seedDatabase.ts`

### Verify Seeding
- [ ] Check barbers table has "Sahil"
- [ ] Check services table has 5 services
- [ ] Verify all fields populated

## Step 7: API Testing

### Test Appointments API
```bash
curl http://localhost:3000/api/appointments
```

### Test Services API
```bash
curl http://localhost:3000/api/services
```

### Test Barbers API
```bash
curl http://localhost:3000/api/barbers
```

### Test Slots API
```bash
curl "http://localhost:3000/api/slots?barberId=550e8400-e29b-41d4-a716-446655440000&date=2024-01-01&serviceDuration=30"
```

## Step 8: Frontend Setup

### Check Components
- [ ] Navbar displays correctly
- [ ] Services section shows all services
- [ ] Theme toggle works
- [ ] Mobile responsive

### Check Dashboards
- [ ] Admin dashboard accessible
- [ ] Barber dashboard accessible
- [ ] Customer dashboard accessible
- [ ] Calendar component displays

### Check Forms
- [ ] Login form validates
- [ ] Signup form validates
- [ ] Booking wizard works smoothly
- [ ] Error messages display

## Step 9: Optional Integrations

### Email Setup
- [ ] [ ] Add SendGrid API key for emails
- [ ] [ ] Configure email templates

### SMS Setup
- [ ] [ ] Add Twilio credentials for SMS
- [ ] [ ] Configure SMS notifications

### Payment Processing
- [ ] [ ] Add Stripe keys for payments
- [ ] [ ] Configure payment endpoints

## Step 10: Production Preparation

### Security
- [ ] [ ] Enable Row-Level Security (RLS) in Supabase
- [ ] [ ] Set up authentication policies
- [ ] [ ] Configure CORS properly
- [ ] [ ] Review environment variables

### Performance
- [ ] [ ] Enable database indexing
- [ ] [ ] Configure caching
- [ ] [ ] Optimize images
- [ ] [ ] Set up CDN

### Deployment
- [ ] [ ] Choose hosting (Vercel recommended)
- [ ] [ ] Set up CI/CD pipeline
- [ ] [ ] Configure domain
- [ ] [ ] Set up SSL/TLS

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

### Supabase Connection Issues
- [ ] Verify API keys in `.env.local`
- [ ] Check Supabase project is active
- [ ] Verify network connectivity
- [ ] Check browser console for errors

### Database Errors
- [ ] Verify schema created in Supabase
- [ ] Check table names match in API
- [ ] Verify permissions in RLS policies
- [ ] Check for foreign key constraints

### Frontend Not Loading
- [ ] Clear browser cache
- [ ] Restart dev server
- [ ] Check for console errors
- [ ] Verify all dependencies installed

## Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Setup database
npm run setup-db

# Seed database
npm run seed

# Type check
npm run type-check
```

## Next Steps

1. [ ] Review SETUP_GUIDE.md for architecture details
2. [ ] Check API_GUIDE.md for endpoint documentation
3. [ ] Explore component library in `/components`
4. [ ] Read through Dashboard implementations
5. [ ] Test emergency booking feature
6. [ ] Customize branding and colors

## Support Resources

- Documentation: See SETUP_GUIDE.md
- API Reference: See API_GUIDE.md
- Component Examples: Check `/components/` directory
- Type Definitions: Check `/lib/types.ts`

## Notes

- Keep `.env.local` file secure and never commit
- Use `.env.example` as reference
- All API endpoints require proper authentication
- Database backups are handled by Supabase (free tier: daily)
- Rate limiting: 1000 requests/hour (free tier)
