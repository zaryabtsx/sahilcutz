# Deployment Guide

## Quick Deploy to Vercel

### Prerequisites
- Vercel account
- GitHub repository
- Supabase project

### Step 1: Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Click "Continue"

### Step 2: Environment Variables
In the "Environment Variables" section, add:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 3: Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete (2-5 minutes)
- [ ] Your site is live!

## Production Checklist

### Security
- [ ] Set up HTTPS (automatic with Vercel)
- [ ] Enable Supabase RLS policies
- [ ] Review authentication flow
- [ ] Set CORS headers properly
- [ ] Hide sensitive environment variables

### Performance
- [ ] Enable image optimization
- [ ] Set up caching headers
- [ ] Configure database connection pooling
- [ ] Enable compression
- [ ] Monitor Core Web Vitals

### Database
- [ ] Enable automated backups
- [ ] Set up database indexes
- [ ] Review query performance
- [ ] Enable extensions if needed
- [ ] Monitor storage usage

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Enable analytics (Google Analytics)
- [ ] Monitor uptime
- [ ] Set up alerts for errors
- [ ] Review logs regularly

## Custom Domain Setup

### Add Domain to Vercel
1. Go to Vercel Project Settings
2. Domains → Add
3. Enter your domain
4. Update DNS records as shown

### Update DNS
Update your domain registrar DNS settings to point to Vercel nameservers

## Environment Configuration for Production

Create `.env.production` with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=production_key

# API
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Optional Services
SENDGRID_API_KEY=your_sendgrid_key
TWILIO_ACCOUNT_SID=your_twilio_sid
STRIPE_SECRET_KEY=your_stripe_key
```

## Supabase Production Settings

### Enable Row-Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Example: Users can only see their own data
CREATE POLICY "Users can see own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Barbers can see their appointments
CREATE POLICY "Barbers see own appointments"
  ON appointments FOR SELECT
  USING (barber_id = (SELECT id FROM barbers WHERE id = auth.uid()));
```

### Database Backups
- Free tier: Daily backups (7-day retention)
- Paid tier: Hourly backups available
- Configure auto-backups in project settings

## Monitoring and Maintenance

### Weekly Tasks
- [ ] Check error logs in Vercel
- [ ] Review database performance
- [ ] Monitor storage usage
- [ ] Check uptime status

### Monthly Tasks
- [ ] Review analytics
- [ ] Update dependencies
- [ ] Security audit
- [ ] Database cleanup

### Quarterly Tasks
- [ ] Full system audit
- [ ] Performance optimization
- [ ] Disaster recovery test
- [ ] Security penetration test

## Scaling Considerations

### Database Scaling
- Current: Single barber, unlimited customers
- For multiple barbers: Already supported in schema
- For high traffic: Enable connection pooling in Supabase

### Frontend Scaling
- Vercel handles auto-scaling
- No configuration needed for increased traffic
- Monitor Vercel analytics

### Performance Optimization
- Enable Next.js Image Optimization
- Use dynamic imports for large components
- Implement infinite scroll for lists
- Cache API responses client-side

## Backup Strategy

### Database Backups
1. **Automatic**: Supabase handles daily backups
2. **Manual**: Export from Supabase dashboard
3. **Frequency**: Weekly full export

### Code Backup
- GitHub repository is your backup
- Enable GitHub Actions for CI/CD
- Keep main branch protected

### Recovery Plan
1. Identify issue
2. Stop application
3. Restore from backup
4. Verify data integrity
5. Deploy fix
6. Resume service

## CDN Configuration

### Cloudflare Setup (Optional)
1. Add site to Cloudflare
2. Update nameservers
3. Enable caching rules
4. Set cache TTL to 1 hour for assets

### Vercel CDN
- Automatic for all deployments
- No configuration needed
- Caches static assets globally

## SSL/TLS Certificate

- Vercel: Automatic SSL for all projects
- Certificate renewal: Automatic
- Custom domains: Add and auto-provisioned

## Disaster Recovery

### In Case of Data Loss
1. Contact Supabase support
2. Restore from backup (7 days available)
3. Or restore from weekly manual export

### In Case of Service Outage
1. Check Vercel status page
2. Check Supabase status page
3. Restart application
4. Check error logs

### Data Migration
- Export from old database
- Import to new database
- Update connection strings
- Verify data integrity
- Deploy updated code

## Cost Optimization

### Supabase (Free Tier)
- 500MB storage
- 2GB bandwidth
- Unlimited API calls (rate limited)
- Daily backups

### Vercel (Free Tier)
- Unlimited deployments
- Serverless functions
- Edge Network included
- 100GB bandwidth

### Upgrade When
- Supabase storage > 500MB
- Vercel bandwidth > 100GB
- Need advanced features

## Rollback Procedure

### In Vercel
1. Go to Deployments
2. Find previous stable version
3. Click "Redeploy"
4. Confirm rollback

### Database Rollback
1. Contact Supabase support
2. Request restore to specific date
3. Verify data integrity
4. Update application if needed

## Monitoring Dashboard

### Key Metrics to Track
- Page load time
- API response time
- Database query time
- Error rate
- Uptime percentage
- User engagement

### Tools
- Vercel Analytics
- Supabase Monitoring
- Google Analytics
- Sentry (for errors)

## Support Contacts

- Vercel Support: support@vercel.com
- Supabase Support: support@supabase.com
- GitHub: Issues and discussions

## Next Steps

1. [ ] Deploy to Vercel
2. [ ] Set up custom domain
3. [ ] Configure monitoring
4. [ ] Enable backups
5. [ ] Set up error tracking
6. [ ] Launch to users
7. [ ] Monitor performance
8. [ ] Iterate and improve
