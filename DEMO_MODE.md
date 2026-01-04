# Demo Mode Guide

## Overview

Demo Mode allows you to navigate and demonstrate the Hail Solutions Group CRM without requiring OAuth authentication. Perfect for presentations, testing, and showcasing features.

## Enabling Demo Mode

### Method 1: UI Toggle (Easiest)

1. Open the app in your browser
2. Look for the **"Demo Mode"** button in the top-right header (next to the offline indicator)
3. Click the button to enable demo mode with Admin role
4. The button will change to show the current role with a badge

### Method 2: Direct URL

Add `?demo=true` to the URL:
```
http://localhost:3000/?demo=true
```

## Switching Roles

Once Demo Mode is enabled, click the demo mode button to see a dropdown with role options:

- **Admin** - Full system access (default)
- **Sales Agent** - Lead management and field operations
- **Appraiser** - Damage assessment and inspections

Each role has different permissions and UI elements visible.

## Demo Data

Demo leads are pre-populated in the database with the following statuses:

| Lead | Status | Location | Notes |
|------|--------|----------|-------|
| John Smith | Lead | Denver | Large hail damage |
| Sarah Johnson | Scheduled | Boulder | Inspection scheduled |
| Mike Davis | In Shop | Aurora | Vehicle in repair |
| Jennifer Brown | Awaiting Pickup | Littleton | Waiting for customer |
| Robert Wilson | Complete | Westminster | Repair completed |

### Seeding Demo Data

To populate demo data:

```bash
node seed-demo-data.mjs
```

## Features Available in Demo Mode

### All Roles Can Access:
- ✅ Dashboard with operational metrics
- ✅ Interactive map with lead locations
- ✅ Lead pipeline (Kanban board)
- ✅ Lead list and details
- ✅ Customer database
- ✅ Analytics dashboard
- ✅ Spreadsheet view

### Admin Role Only:
- ✅ User management
- ✅ Financial data (estimates, invoices)
- ✅ Advanced analytics
- ✅ Data export
- ✅ Permission management

### Sales Role:
- ✅ Lead creation and management
- ✅ Customer follow-ups
- ✅ Map-based lead tracking
- ✅ SMS templates

### Appraiser Role:
- ✅ Inspection forms
- ✅ Damage assessment
- ✅ Estimate creation
- ✅ Photo documentation

## Exiting Demo Mode

Click the demo mode button and select **"Exit Demo Mode"** to return to normal authentication flow.

## Demo Mode Persistence

Demo mode settings are saved to localStorage and will persist across page refreshes. To completely clear:

```javascript
// In browser console
localStorage.removeItem('demo_mode');
localStorage.removeItem('demo_user');
document.cookie = 'demo_auth=; path=/; max-age=0';
location.reload();
```

## Limitations

- Demo mode is **client-side only** - no actual authentication occurs
- Demo users cannot modify real user data
- All changes are stored in the demo session only
- Exiting demo mode clears all demo session data

## Troubleshooting

### Demo mode button not appearing?
- Ensure DemoProvider is wrapped in main.tsx
- Check browser console for errors
- Clear browser cache and reload

### Demo data not showing?
- Run `node seed-demo-data.mjs` to populate demo leads
- Check database connection in .env file
- Verify DATABASE_URL is set correctly

### Roles not switching?
- Check browser console for errors
- Ensure localStorage is enabled
- Try clearing localStorage and re-enabling demo mode

## For Presentations

1. **Before the demo:**
   - Enable demo mode with Admin role
   - Seed demo data: `node seed-demo-data.mjs`
   - Navigate to Dashboard to show overview
   - Test all major features

2. **During the demo:**
   - Use the demo mode toggle to switch roles and show permission differences
   - Navigate through the Kanban board to show pipeline workflow
   - Click on leads to show detail pages and features
   - Use the map to show geolocation capabilities

3. **Tips:**
   - Start with Dashboard for high-level overview
   - Move to Kanban board to show workflow
   - Drill into specific leads to show details
   - Use Analytics to show data insights
   - Switch roles to show permission-based UI changes
