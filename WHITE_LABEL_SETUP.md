# HailTrack CRM - White-Label Setup Guide

This guide explains how to customize and deploy the white-label version of HailTrack CRM for your customers.

## Overview

The white-label version removes all Hail Solutions Group branding and provides a generic "HailTrack CRM" interface that can be customized per customer organization.

## Key Differences from Original

### Branding Changes
- **App Name:** "Hail Solutions Group" → "HailTrack CRM"
- **Tagline:** "Field Sales CRM" (generic, customizable per org)
- **Logo:** Generic placeholder (customizable per org)
- **Colors:** Neutral palette (customizable per org)

### Architecture Changes
- **Multi-tenant:** Each customer organization has isolated data
- **Organization Management:** Admin interface for creating/managing orgs
- **Custom Domains:** Support for customer-specific domains
- **Billing Integration:** Stripe-ready for subscription management

## Repository Structure

```
hailtrack-crm/                    # White-label version
├── client/                       # Frontend (React)
├── server/                       # Backend (Node.js + tRPC)
├── drizzle/                      # Database schema
├── DEPLOYMENT_CHECKLIST.md       # Setup checklist
├── EXECUTIVE_PITCH.md            # Business pitch document
├── PRICING_CALCULATOR.md         # Pricing strategy
└── WHITE_LABEL_BUSINESS_PLAN.md  # Business plan
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/andrewdspeed/hailtrack-crm.git
cd hailtrack-crm
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create `.env` file:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/hailtrack

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_random_secret_key

# Twilio (SMS notifications)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Hail Recon API (optional)
HAIL_RECON_API_KEY=your_api_key

# AWS S3 (for photo storage)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=hailtrack-uploads

# Stripe (for billing - optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google Maps (optional, proxy available via Manus)
GOOGLE_MAPS_API_KEY=your_api_key

# OAuth (if using Manus platform)
OAUTH_SERVER_URL=https://api.manus.im
OWNER_OPEN_ID=your_owner_id
```

### 4. Initialize Database

```bash
pnpm db:push
```

This creates all tables and seeds default roles/permissions.

### 5. Start Development Server

```bash
pnpm dev
```

Visit http://localhost:3000

### 6. Create First Organization

Use the admin interface or API to create your first customer organization:

```typescript
// POST /api/organizations
{
  "name": "ABC Hail Repair",
  "subdomain": "abc-hail",  // abc-hail.hailtrack.com
  "tier": "professional",    // starter, professional, enterprise
  "customBranding": {
    "logo": "https://...",
    "primaryColor": "#1e40af",
    "companyName": "ABC Hail Repair"
  }
}
```

## Customization Options

### Per-Organization Branding

Each organization can customize:
- **Logo:** Upload custom logo (replaces HailTrack logo)
- **Company Name:** Displayed in header and emails
- **Primary Color:** Used for buttons, links, accents
- **Custom Domain:** e.g., crm.abchailrepair.com

### Global Branding

To change the default HailTrack branding:

1. **Update App Title:**
   - Edit `client/index.html` → `<title>` tag
   - Edit `VITE_APP_TITLE` environment variable

2. **Update Logo:**
   - Replace `client/public/logo.png`
   - Update `VITE_APP_LOGO` environment variable

3. **Update Colors:**
   - Edit `client/src/index.css` → CSS variables
   - Modify Tailwind theme in `tailwind.config.ts`

4. **Update Copy:**
   - Search for "HailTrack" in codebase
   - Replace with your brand name

## Multi-Tenant Architecture

### Data Isolation

Each organization's data is isolated using `organization_id` foreign keys:

```sql
-- All tables include organization_id
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  ...
);
```

### User Management

Users can belong to multiple organizations with different roles:

```sql
CREATE TABLE user_organizations (
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  role_id UUID REFERENCES roles(id),
  PRIMARY KEY (user_id, organization_id)
);
```

### Subdomain Routing

Organizations are accessed via subdomains:
- `abc-hail.hailtrack.com` → ABC Hail Repair
- `xyz-pdr.hailtrack.com` → XYZ PDR Shop

Middleware extracts `organization_id` from subdomain and filters all queries.

## Billing Integration

### Stripe Setup

1. Create Stripe account at https://stripe.com
2. Get API keys from Dashboard → Developers → API keys
3. Add keys to `.env`
4. Create products and prices in Stripe Dashboard

### Subscription Tiers

Map Stripe price IDs to tiers:

```typescript
const STRIPE_PRICES = {
  starter: 'price_...',      // $99/month
  professional: 'price_...', // $249/month
  enterprise: 'price_...',   // $499/month
};
```

### Webhook Handling

Set up Stripe webhook to handle:
- `customer.subscription.created` → Activate organization
- `customer.subscription.updated` → Update tier
- `customer.subscription.deleted` → Suspend organization
- `invoice.payment_failed` → Send payment reminder

## Deployment Options

### Option 1: Manus Platform (Recommended)

Easiest deployment with built-in:
- Hosting & auto-scaling
- PostgreSQL database
- S3 storage
- SSL certificates
- Custom domains

Steps:
1. Push code to GitHub
2. Connect repo to Manus
3. Click "Publish"
4. Configure custom domain in Manus UI

### Option 2: Self-Hosted (AWS/Azure/GCP)

Requirements:
- Node.js 18+ server
- PostgreSQL database
- S3-compatible storage
- SSL certificate
- Reverse proxy (Nginx)

Steps:
1. Provision server and database
2. Clone repo and install dependencies
3. Set environment variables
4. Run `pnpm build`
5. Start with `pnpm start`
6. Configure Nginx reverse proxy
7. Set up SSL with Let's Encrypt

### Option 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

Deploy with Docker Compose:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/hailtrack
    depends_on:
      - db
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=hailtrack
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```

## Customer Onboarding

### Step 1: Create Organization

Admin creates organization in system:
- Company name
- Subdomain
- Pricing tier
- Initial admin user

### Step 2: Send Welcome Email

Email includes:
- Login URL (subdomain)
- Temporary password
- Setup checklist
- Support contact

### Step 3: Guided Setup

Customer completes onboarding wizard:
1. Upload logo and set colors
2. Add team members
3. Configure SMS (Twilio)
4. Import existing leads (CSV)
5. Complete first lead

### Step 4: Training

Provide:
- Video tutorials
- Documentation
- Live training session (Enterprise tier)
- Ongoing support

## Monitoring & Support

### Application Monitoring

Use tools like:
- **Datadog** - APM, logs, metrics
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Uptime Robot** - Availability monitoring

### Customer Support

Provide multi-channel support:
- **Email:** support@hailtrack.com
- **Chat:** Intercom or Crisp
- **Phone:** Enterprise tier only
- **Knowledge Base:** Help docs
- **Community:** Slack or Discord

### SLA Commitments

- **Starter:** Email support, 48-hour response
- **Professional:** Email + phone, 24-hour response
- **Enterprise:** 24/7 phone, 4-hour response, 99.9% uptime SLA

## Scaling Considerations

### Database

- Use connection pooling (PgBouncer)
- Add read replicas for analytics
- Partition large tables by organization_id
- Regular backups with point-in-time recovery

### Application

- Horizontal scaling with load balancer
- Stateless design (no session state on server)
- CDN for static assets (Cloudflare)
- Redis for caching and rate limiting

### Storage

- Use S3 or compatible object storage
- Enable CDN for uploaded photos
- Implement lifecycle policies (archive old files)
- Compress images before upload

## Security Best Practices

### Authentication

- Enforce strong passwords (8+ chars, mixed case, numbers)
- Implement 2FA for admin accounts
- Use JWT with short expiration (1 hour)
- Refresh tokens for long sessions

### Authorization

- Enforce RBAC on all endpoints
- Validate organization_id on every query
- Audit log all sensitive operations
- Rate limit API endpoints

### Data Protection

- Encrypt data at rest (AES-256)
- Encrypt data in transit (TLS 1.3)
- Regular security audits
- GDPR compliance (data export, deletion)

## Troubleshooting

### Common Issues

**Database connection fails:**
- Check DATABASE_URL format
- Verify PostgreSQL is running
- Check firewall rules

**SMS not sending:**
- Verify Twilio credentials
- Check phone number format (+1...)
- Ensure Twilio account has credit

**Map not loading:**
- Check GOOGLE_MAPS_API_KEY
- Verify API is enabled in Google Console
- Check browser console for errors

**Offline mode not working:**
- Ensure HTTPS (required for service workers)
- Check browser compatibility
- Clear cache and reload

## Next Steps

1. **Test thoroughly** - Create test organization and run through all workflows
2. **Document customizations** - Keep track of changes from base version
3. **Set up monitoring** - Configure alerts for errors and downtime
4. **Plan marketing** - Use business plan documents to guide go-to-market
5. **Recruit beta customers** - Get 5-10 early adopters for feedback

## Support

For technical questions or issues with the white-label version:
- Email: dev@hailtrack.com
- GitHub Issues: https://github.com/andrewdspeed/hailtrack-crm/issues
- Documentation: https://docs.hailtrack.com

For business inquiries (licensing, partnerships):
- Email: partnerships@hailtrack.com
