# Hail Solutions Group - Field Sales App TODO

## Core Features
- [x] Database schema for leads, vehicles, and follow-ups
- [x] Interactive map component with geotagging
- [x] Lead creation form with minimal required fields (Address only)
- [x] Vehicle information capture (Year, Make, Model, Color, VIN)
- [x] Insurance policy information fields
- [x] Glass damage tracking
- [x] Adjuster information fields
- [x] Rental car information fields
- [x] Lead status pipeline (Lead > Scheduled > In Shop > Awaiting Pickup > Complete)
- [x] Agent assignment to leads
- [x] Follow-up tracking system
- [x] Text message templates for each stage
- [x] Copy-paste functionality for templates
- [x] Notes section for each lead
- [x] Visual map display of all geotagged leads
- [x] Agent-specific lead filtering
- [x] Mobile-responsive design

## Clarified Requirements from User
- [x] All agents can view all leads (1-4 agents total)
- [x] Role-based editing: only lead owner or admin can edit
- [x] Lead creation: address is only required field, all else optional
- [x] Support "no answer" and "not interested" leads for future follow-up
- [x] Sub-status system for In Shop status (waiting approval, waiting parts, in repair)
- [x] Follow-up cooldown timer: Red (0-48h), Yellow (48-72h), Green (72h+)
- [x] Successful follow-up auto-moves lead to "Scheduled"
- [x] Copy/paste text templates with one-click copy button
- [x] Visual cooldown indicator on lead cards

## Bug Fixes
- [x] Fix Google Maps API duplicate loading error in MapView

## Notification System
- [x] Set up Twilio credentials in secrets
- [x] Implement push notification system
- [x] Browser notification permission handling
- [x] Email notification system (daily digest)
- [x] Email alerts for status changes
- [x] SMS notification via Twilio
- [x] Notification preferences UI
- [x] Follow-up cooldown expiration notifications
- [x] New lead assignment notifications

## Google Calendar Integration
- [x] Set up Google Calendar API credentials
- [x] Implement OAuth 2.0 authentication flow
- [x] Auto-create calendar events when lead status changes to "Scheduled"
- [x] Include customer details and appointment info in events
- [x] Add calendar sync UI
- [x] Allow editing/deleting calendar events
- [ ] Show upcoming appointments in dashboard

## Real-time GPS Tracking
- [x] Implement continuous GPS location updates on map
- [x] Show moving blue dot for current user location
- [x] Add auto-center toggle to follow user as they move
- [x] Display GPS accuracy indicator
- [x] Update location every few seconds while map is active

## Customer Database Dashboard
- [x] Create dedicated Customers page with comprehensive view
- [x] Implement search functionality across all customer fields
- [x] Add filtering by status, agent, date range
- [x] Display customer statistics (total, active, completed)
- [x] Show all vehicles per customer
- [x] Display insurance information
- [x] Add CSV/Excel export functionality
- [x] Include customer history and timeline
- [x] Add quick actions (call, email, view on map)

## Spreadsheet View
- [x] Create spreadsheet-style table view with all lead fields
- [x] Display agent, address, status, and claims process info
- [x] Show vehicle details (year, make, model, color, VIN)
- [x] Include insurance info (provider, policy #, claim #)
- [x] Display adjuster information (name, phone, email, hours)
- [x] Show rental car details (company, confirmation #)
- [x] Add glass damage status column
- [x] Implement column sorting
- [x] Add horizontal scrolling for wide table
- [x] Include export to CSV/Excel functionality

## Bug Fixes - Database & GPS
- [x] Fix "Database connection failed" error when saving leads
- [x] Improved error messages to show actual errors
- [ ] Verify mobile GPS tracking updates location in real-time
- [ ] Test lead creation and saving functionality

## Offline Mode Implementation
- [x] Set up IndexedDB for offline data storage
- [x] Create offline queue for pending leads
- [x] Build automatic background sync when connection restored
- [x] Add sync status indicators in UI
- [x] Show pending sync count badge
- [x] Add "Offline Mode" indicator in header
- [x] Implement offline lead creation
- [x] Auto-sync when connection restored
- [ ] Test offline mode thoroughly

## Agent Performance Dashboard
- [x] Create Analytics/Dashboard page
- [x] Calculate conversion rates per agent
- [x] Display total leads per agent
- [x] Show completed jobs count
- [x] Build performance leaderboard
- [x] Add visual charts (bar, pie)
- [x] Display agent rankings
- [x] Detailed statistics table by status
- [x] Overall stats cards
- [ ] Add date range filters
- [ ] Track monthly revenue by agent
- [ ] Export analytics to PDF/CSV

## Automated Daily Digest Emails
- [x] Create email template for daily digest
- [x] Implement digest generation logic (leads needing follow-up)
- [x] Filter leads by expired cooldown (72+ hours)
- [x] Personalize digest per agent
- [x] Include summary statistics
- [x] Add direct links to leads in email
- [x] Schedule daily email at 8 AM using schedule tool
- [ ] Test digest email delivery

## Bug Fixes - Geolocation & TypeScript
- [x] Fix geolocation error in MapView with better error handling
- [x] Fix TypeScript compilation errors in digest-service.ts
- [x] Improve GPS permission handling and fallback

## Photo Upload for Damage Documentation
- [x] Add photos table to database schema
- [x] Implement S3 storage integration
- [x] Create photo upload API endpoints
- [x] Build photo upload UI component
- [x] Add camera capture functionality
- [x] Support multiple photo uploads
- [ ] Display photo thumbnails in lead details
- [ ] Show photos in spreadsheet view
- [ ] Add photo deletion capability
- [ ] Implement photo viewer/lightbox

## Tab Navigation System
- [x] Design tab navigation component
- [x] Implement tabs for Map View, Leads, Customers, Spreadsheet, Analytics
- [x] Add active tab state management
- [x] Style tabs for mobile and desktop
- [x] Replace separate navigation buttons with unified tab system

## Phase 1: Foundation Features
- [x] Photo gallery lightbox viewer component
- [x] Display photos in lead detail page
- [x] Show photo thumbnails in leads list
- [ ] Show photo thumbnails in spreadsheet view
- [x] Photo deletion from lead details
- [ ] Before/after photo comparison
- [x] Document management database schema
- [x] Document upload API endpoints
- [x] Document list and viewer UI
- [x] Advanced search component with global search
- [x] Saved filter presets
- [x] Quick filter buttons (needs follow-up, overdue, etc.)
- [x] Date range filtering

## Phase 2: Business Operations
- [ ] Estimates database schema
- [ ] Estimate creation form
- [ ] Invoice generation from estimates
- [ ] PDF export for estimates/invoices
- [ ] Email estimates to customers
- [ ] Payment status tracking
- [ ] Bulk actions (select multiple leads)
- [ ] Lead tags system
- [ ] Quick stats dashboard on homepage
- [ ] Dark mode toggle
- [ ] Print-friendly views

## Phase 3: Advanced Analytics
- [ ] Revenue tracking per agent
- [ ] Monthly revenue reports
- [ ] Conversion funnel visualization
- [ ] Average time in each status
- [ ] Heat map of lead locations
- [ ] Profit margin calculations
- [ ] Export analytics to PDF

## Phase 4: Team Collaboration
- [ ] Internal notes on leads
- [ ] @mention system for team members
- [ ] Task assignment and checklists
- [ ] Activity feed (who did what)
- [ ] Team calendar view
- [ ] Lead assignment notifications

## Phase 5: Automation
- [ ] Auto-assign leads by location/workload
- [ ] Automatic status transitions
- [ ] Scheduled follow-up reminders
- [ ] Auto-send SMS at specific stages
- [ ] Workflow rules engine

## Phase 6: Integrations
- [ ] CSV/Excel import for leads
- [ ] Enhanced export to Google Sheets
- [ ] Webhook system for external integrations
- [ ] Zapier integration support
- [ ] QuickBooks/Xero integration

## Phase 7: Customer Portal
- [ ] Customer authentication system
- [ ] Customer dashboard
- [ ] View repair status
- [ ] Upload photos from customer side
- [ ] Digital estimate approval
- [ ] Customer notifications

## Phase 8: Mobile Enhancements
- [ ] Voice notes recording
- [ ] VIN barcode scanner
- [ ] Offline photo capture
- [ ] Enhanced push notifications
- [ ] Quick actions from notifications

## Estimate & Invoice System (Current Focus)
- [x] Create estimates database table
- [x] Create estimate_line_items table
- [x] Create invoices database table
- [x] Build EstimateForm component with line item management
- [x] Add tax and discount calculations
- [ ] Implement PDF generation service
- [ ] Create estimate PDF template
- [ ] Create invoice PDF template
- [ ] Add email delivery for estimates/invoices
- [x] Build estimate approval workflow
- [x] Convert estimate to invoice functionality
- [x] Payment status tracking
- [ ] Estimate/invoice list view
- [ ] Estimate/invoice detail view
- [x] Integration with LeadDetail page

## Bulk Actions & Tags System
- [x] Tags database schema (tags, lead_tags tables)
- [x] Default tags created (Hot Lead, VIP, Referral, Follow Up, Priority)
- [x] Tag management API (create, delete, add to lead, remove from lead)
- [x] Bulk operations API (update status, add/remove tags)
- [x] Bulk selection checkboxes in Leads page
- [x] Select All functionality
- [x] BulkActionsToolbar component
- [x] Tag badges display on lead cards
- [x] Click to toggle tags on leads

## Quick Stats Dashboard
- [x] QuickStats component with 6 key metrics
- [x] New Leads Today counter
- [x] Follow-ups Due counter
- [x] Active Leads counter
- [x] In Shop counter
- [x] Awaiting Pickup counter
- [x] Completed This Week counter
- [x] Integrated into MapView page

## Paper Lead Sheet OCR & Auto-Import
- [x] Image upload interface for paper forms
- [x] OCR service integration (text extraction from images)
- [x] AI-powered form field parser
- [x] Field mapping (name, phone, address, VIN, insurance, etc.)
- [x] Preview extracted data before import
- [x] Manual correction interface
- [x] Error handling and validation
- [x] Import Leads page with full form
- [x] Integration with navigation

## PDF Support for OCR Import
- [x] Update file upload to accept PDF files
- [x] Add PDF to image conversion backend service
- [x] Extract first page from PDF for single-page scans
- [x] Update UI to show PDF preview
- [x] Handle both image and PDF file types
- [x] Ready for Google Drive scanned PDFs

## Multi-Page PDF Processing & Confidence Scoring
- [x] Extract all pages from multi-page PDFs
- [x] Convert each page to image for OCR
- [x] Process multiple pages in sequence
- [x] Add confidence scoring to OCR extraction
- [x] Confidence levels: high (>80%), medium (50-80%), low (<50%)
- [x] Visual indicators for field confidence
- [x] Batch processing UI with progress bar
- [x] Bulk review interface showing all extracted leads
- [x] Highlight uncertain fields for manual review
- [x] Batch approve/create leads functionality
- [x] Color-coded confidence indicators

## Advanced Analytics Dashboard
- [x] Backend analytics aggregation functions
- [x] Conversion funnel data (Lead → Scheduled → In Shop → Complete)
- [x] Revenue trends over time (daily/weekly/monthly)
- [x] Agent performance metrics (leads, conversions, revenue per agent)
- [x] Average repair duration by status
- [x] Conversion funnel visualization chart (horizontal bar)
- [x] Revenue trends line chart with monthly grouping
- [x] Agent performance bar/comparison charts
- [x] Repair duration metrics in header cards
- [x] Export to CSV functionality
- [x] Analytics page layout and design
- [x] Real-time data updates via tRPC
- [x] Agent leaderboard with rankings
- [x] Detailed agent statistics table

## Date Range Picker (Current Focus)
- [ ] Install date picker dependencies (react-day-picker)
- [ ] Create DateRangePicker component
- [ ] Add preset buttons (Last 7 Days, This Month, Last Quarter, etc.)
- [ ] Integrate with Analytics page
- [ ] Apply date filter to all analytics queries
- [ ] Persist selected range in state

## Automated Email Reports
- [ ] Create email report template
- [ ] Generate PDF from analytics data
- [ ] Email service integration (using existing setup)
- [ ] Schedule configuration (weekly/monthly)
- [ ] Recipient management
- [ ] Report content customization
- [ ] Automated scheduling system

## Lead Source Tracking & Digital Marketing Integration
- [ ] Add source field to leads database schema
- [ ] Add source_details JSON field for UTM parameters
- [ ] Add referral_code field to leads
- [ ] Create lead_sources reference table
- [ ] Update NewLead form with source dropdown
- [ ] Update ImportLeads OCR to capture source
- [ ] Automatic source detection from UTM parameters
- [ ] UTM parameter capture middleware
- [ ] Referral code generation system
- [ ] Referral tracking dashboard
- [ ] Lead source ROI analytics backend
- [ ] Lead source performance charts
- [ ] Source comparison visualizations
- [ ] Cost per lead by source
- [ ] Conversion rate by source

## Public Website Form Integration
- [ ] Create public lead submission form page
- [ ] Automatic source tagging (Online Form)
- [ ] UTM parameter capture on form load
- [ ] Referral code URL parameter support
- [ ] Form validation and submission
- [ ] Thank you page with tracking
- [ ] Integration with CRM database
- [ ] Spam protection (reCAPTCHA)
- [ ] Email notification on new web lead
- [ ] Mobile-responsive form design

## Referral Tracking System
- [ ] Generate unique referral codes per customer
- [ ] Referral code validation
- [ ] Track referral source customer
- [ ] Referral rewards/commission tracking
- [ ] Referral performance dashboard
- [ ] Share referral link functionality

## Payment Authorization Forms (Current Focus)
- [ ] Create authorization_forms database table
- [ ] Add form types (direction to pay, repair authorization, etc.)
- [ ] Digital signature capture component
- [ ] PDF generation of signed forms
- [ ] Attach forms to lead records
- [ ] Form status tracking (pending, signed, voided)
- [ ] Email forms to customers for signature
- [ ] Form templates management
- [ ] Admin approval workflow

## Insurance Payment Tracking
- [ ] Create insurance_payments database table
- [ ] Payment receipt form (check number, amount, date)
- [ ] Match payments to estimates/invoices
- [ ] Payment status tracking (pending, received, deposited)
- [ ] Payment history timeline per lead
- [ ] Partial payment support
- [ ] Payment reconciliation view
- [ ] Export payment reports

## Administrator Access Controls
- [ ] Update user roles (add admin flag to users table)
- [ ] Role-based permission middleware
- [ ] Hide payment details from non-admin users
- [ ] Admin-only financial dashboard
- [ ] Audit trail for sensitive operations
- [ ] Permission checks on API endpoints
- [ ] UI conditional rendering based on role
- [ ] Admin user management interface

## Mobile UI & GPS Fixes
- [x] Fix mobile UI overlapping issues
- [x] Check responsive breakpoints
- [x] Fix QuickStats cards on mobile (2-column on mobile, 3 on tablet, 6 on desktop)
- [x] Fix tab navigation on mobile (icons only on small screens)
- [x] Debug GPS geolocation not working on map
- [x] Add GPS permission request flow
- [x] Add GPS status indicator (requesting/active/denied)
- [x] Add better error messages for GPS issues
- [x] Add visual active GPS indicator (green pulsing dot)

## Role-Based Access Control (RBAC) System (Current Focus)
- [x] Create roles table (system_admin, admin, sales, appraiser, estimator, marketing, repair_tech)
- [x] Create permissions table (permission tags)
- [x] Create user_roles junction table
- [x] Create user_permissions junction table
- [x] Create role_permissions junction table
- [x] Insert 7 default roles
- [x] Insert 12 permission tags (financial, data, operations, analytics, administration)
- [ ] Define default permissions per role
- [ ] Build role assignment API
- [ ] Build permission assignment API
- [ ] Implement authentication middleware with role checking
- [ ] Add permission checking helper functions
- [ ] Create admin UI for user management
- [ ] Create role assignment interface
- [ ] Create permission tag interface
- [ ] Add role-based UI conditional rendering
- [ ] Hide financial data from non-authorized roles
- [ ] Restrict estimate editing by role
- [ ] Restrict payment operations by role
- [ ] Add audit logging for permission changes
- [ ] Test all role combinations

## RBAC Implementation Sprint (Current Focus - Day 1)
### Day 1: Backend Foundation & API
- [x] Task 1.1: Define default role permissions in rbac-config.ts
- [x] Task 1.2: Seed default permissions into database
- [x] Task 1.3: Build permission helper functions (getUserRoles, hasPermission, etc.)
- [x] Task 1.4: Create RBAC middleware for tRPC
- [x] Task 1.5: Build RBAC management API (assign roles, grant permissions)
- [x] Task 1.6: Apply permission checks to existing routes

### Day 2: Frontend UI & Integration
- [x] Task 2.1: Create usePermissions hook
- [x] Task 2.2: Build User Management page
- [x] Task 2.3: Add conditional UI rendering
- [x] Task 2.4: Create PermissionDenied components
- [x] Task 2.5: Add role badges and indicators
- [x] Task 2.6: Testing and bug fixes
- [x] Task 2.7: Documentation and handoff

## Feature Implementation: Inspection, Loaner Vehicles, Technician Assignment

### Phase 1: Inspection Form Integration
- [x] Add inspection tab to LeadDetail page
- [x] Connect InspectionForm component to lead workflow
- [x] Add inspection status indicators
- [x] Test inspection form submission and viewing

### Phase 2: Loaner Vehicle Database & API
- [x] Create loaner_vehicles table schema
- [x] Create vehicle_assignments table schema
- [x] Run database migration
- [x] Build loaner vehicle CRUD API
- [x] Build assignment tracking API
- [x] Add permission checks (manage_loaner_vehicles)

### Phase 3: Loaner Vehicle Management UI
- [x] Create LoanerVehicles page with inventory list
- [x] Build vehicle status tracking (available/assigned/maintenance)
- [x] Create assignment interface
- [x] Add maintenance log functionality
- [x] Add quick availability check to LeadDetail

### Phase 4: Technician Assignment Database & API
- [x] Create technicians table schema
- [x] Create job_assignments table schema
- [x] Run database migration
- [x] Build technician management API
- [x] Build assignment tracking API
- [x] Add permission checks (assign_technicians)

### Phase 5: Technician Assignment UI & Workflow
- [x] Create Technicians page with staff list
- [x] Build assignment interface in LeadDetail
- [x] Add workload balancing indicators
- [x] Create assignment history view
- [x] Add technician availability tracking

### Phase 6: Testing & Delivery
- [x] Test all three features end-to-end
- [x] Verify permission enforcement
- [x] Update documentation
- [x] Create checkpoint and push to GitHub

## UX Enhancements: Assignment Flows & Mobile Optimization

### Enhancement 1: Technician Assignment in LeadDetail
- [x] Add Technicians tab to LeadDetail page
- [x] Create technician assignment dialog
- [x] Display active assignments with status
- [x] Show assignment history
- [x] Add workload indicators for available technicians

### Enhancement 2: Loaner Vehicle Assignment in LeadDetail
- [x] Add Loaner Vehicle section to LeadDetail (In Shop stage)
- [x] Create loaner assignment dialog with available vehicles
- [x] Add mileage and fuel level tracking on assignment
- [x] Display active loaner assignment
- [x] Add return vehicle functionality

### Enhancement 3: Mobile-Optimized Responsive Design
- [x] Optimize LoanerVehicles page for mobile/tablet
- [x] Optimize Technicians page for mobile/tablet
- [x] Improve card layouts for small screens
- [x] Optimize dialogs for mobile interaction
- [x] Test on various screen sizes

## Operational Efficiency Features: Status Updates, Notifications & Widgets

### Feature 1: Status Update Workflow
- [x] Add quick-action buttons for technician status updates (Start Work, Mark Complete)
- [x] Add loaner return workflow with condition check
- [x] Add inspection completion quick actions
- [x] Update UI to show status changes in real-time
- [x] Add confirmation dialogs for critical status changes

### Feature 2: Notification System
- [x] Build notification API endpoints
- [x] Integrate SMS notifications via Twilio
- [x] Add push notification support
- [x] Create notification preferences UI
- [x] Implement notification triggers (assignment, completion, due dates)
- [x] Add notification history view

### Feature 3: Dashboard Widgets
- [x] Create "Today's Assignments" widget for Map page
- [x] Create "Available Loaners" widget
- [x] Create "Pending Inspections" widget
- [x] Add widget refresh functionality
- [x] Optimize widget layout for mobile

## UI Reorganization: Separate Dashboard and Map

- [x] Create dedicated Dashboard page with operational widgets
- [x] Move Today's Assignments widget to Dashboard
- [x] Move Available Loaners widget to Dashboard
- [x] Move Pending Inspections widget to Dashboard
- [x] Add QuickStats to Dashboard page
- [x] Remove dashboard widgets from Map page
- [x] Update navigation to include Dashboard link
- [x] Test both pages independently

## Customer Portal & Advanced Features

### Customer Portal (Priority)
- [ ] Create customer_portal_access table for authentication
- [ ] Build customer portal login/access system
- [ ] Create customer dashboard showing repair status
- [ ] Add estimate/invoice viewing for customers
- [ ] Enable photo upload from customers
- [ ] Add messaging system between customer and staff
- [ ] Create mobile-responsive customer portal UI
- [ ] Add email notifications for portal access

### Automated Reminders
- [ ] Create reminders table schema
- [ ] Build reminder scheduling API
- [ ] Add appointment reminder triggers
- [ ] Add payment due date reminders
- [ ] Add inspection follow-up reminders
- [ ] Create reminder management UI for staff

### Reporting Dashboard
- [ ] Create Reports page with date range filters
- [ ] Add revenue report with charts
- [ ] Add technician productivity report
- [ ] Add loaner utilization report
- [ ] Add lead conversion metrics
- [ ] Enable PDF export for all reports
- [ ] Add email report scheduling

## Navigation Fixes

- [x] Fix schema.ts boolean import error
- [x] Remove Spreadsheet as standalone tab
- [x] Add Spreadsheet as submenu option in Leads
- [x] Ensure tab navigation persists across all pages
- [x] Test navigation flow from all pages

## Data Model Restructuring: Customer-Vehicle Separation

### Phase 1: Database Schema
- [ ] Create new customers table (contact info, address)
- [ ] Modify vehicles table to link to customers
- [ ] Add customerId foreign key to vehicles
- [ ] Move status workflow to vehicles table
- [ ] Run database migrations

### Phase 2: Backend APIs
- [ ] Create customer CRUD API
- [ ] Update vehicle API to require customerId
- [ ] Add getVehiclesByCustomer endpoint
- [ ] Update all related APIs (estimates, invoices, photos, etc.)
- [ ] Update analytics queries

### Phase 3: Frontend Pages
- [ ] Create CustomerDetail page showing all vehicles
- [ ] Update Leads page to show customers with vehicle counts
- [ ] Update vehicle detail page with customer info
- [ ] Add "Add Vehicle" button to customer page
- [ ] Update forms to separate customer/vehicle fields

### Phase 4: Dashboard & Analytics
- [ ] Update QuickStats for new data model
- [ ] Update Dashboard widgets
- [ ] Update Analytics page queries
- [ ] Update Spreadsheet view

### Phase 5: Testing & Debug
- [ ] Test customer CRUD operations
- [ ] Test vehicle workflow through all stages
- [ ] Test multiple vehicles per customer
- [ ] Fix any bugs found
- [ ] Push to GitHub

## Database Restructuring: Customer → Vehicle Hierarchy (COMPLETED)
- [x] Created new leads table (potential customers before conversion)
- [x] Created new customers table (converted leads)
- [x] Enhanced vehicles table with status workflow and all repair tracking
- [x] Created vehicle_insurance table (insurance per vehicle)
- [x] Updated estimates/invoices to link to vehicles
- [x] Created vehicle_photos and vehicle_documents tables
- [x] Dropped old tables and applied new schema
- [x] 32 tables now in database with proper hierarchy

## Backend API Updates for New Data Model
- [ ] Update leads router for new schema
- [ ] Create customers router
- [ ] Update vehicles router with status workflow
- [ ] Update estimates/invoices to use vehicleId
- [ ] Create lead-to-customer conversion API
- [ ] Update analytics for new data model

## Frontend Updates for New Data Model
- [ ] Update Leads page for new lead statuses
- [ ] Create Customers page with vehicle list
- [ ] Update LeadDetail to show vehicles
- [ ] Create CustomerDetail page
- [ ] Update VehicleDetail with full workflow
- [ ] Update Map to show leads and customers
- [ ] Update Dashboard for new metrics

## Lead-to-Customer Conversion Flow

- [x] Build backend conversion API endpoint
- [x] Create conversion confirmation dialog
- [x] Integrate conversion into vehicle status update
- [x] Test conversion flow end-to-end
- [ ] Push to GitHub

## Kanban Board Implementation
- [x] Install react-beautiful-dnd dependency
- [x] Build KanbanBoard main component with 5 columns
- [x] Build KanbanCard component with lead details
- [x] Implement drag-and-drop functionality
- [x] Add backend API for status updates
- [x] Implement real-time sync with polling
- [x] Add mobile responsiveness (horizontal scrolling)
- [x] Add filter by agent/tag functionality
- [x] Integrate into navigation (add Kanban tab)
- [ ] Test drag-and-drop and status updates
- [ ] Push to GitHub

## In-App Guided Tour Implementation
- [x] Create tour context and step definitions
- [x] Build tour overlay and tooltip components
- [x] Integrate tour into Dashboard, Map, and Kanban pages
- [x] Add tour trigger button to header
- [ ] Test tour flow end-to-end
- [ ] Push to GitHub

## Missing Features & Bug Fixes
- [x] Fix Analytics page visibility and routing
- [x] Fix Kanban board visibility in navigation
- [x] Create personalized 404 error pages
- [x] Build user profile dropdown with preferences
- [x] Create personalization settings page
- [x] Add profile preferences storage (theme, language, etc)
- [x] Fix demo mode admin permissions for Analytics
- [x] Test all pages and features
- [x] Push to GitHub

## Advanced Map Features
- [x] Add canvassed zone highlighting with polygon overlays
- [x] Create interactive lead marker info windows
- [x] Build route suggestion engine using Hail Recon + lead data
- [x] Implement route optimization algorithm (TSP/nearest neighbor)
- [x] Create route UI with turn-by-turn directions
- [x] Add route export and sharing functionality
- [x] Test all map features
- [x] Push to GitHub

## Team Route Coordination
- [x] Create database schema for active routes and agent locations
- [x] Build real-time location sharing API
- [ ] Add agent location markers on map
- [ ] Show active routes of other agents
- [ ] Add territory boundaries and conflict detection
- [ ] Create team coordination dashboard
- [ ] Test real-time updates

## Route History & Analytics
- [ ] Create database schema for route history
- [ ] Track route completion with timestamps
- [ ] Calculate actual vs estimated time
- [ ] Track conversion rates per route
- [ ] Build route analytics dashboard
- [ ] Add route performance charts
- [ ] Test analytics tracking

## Offline Route Caching
- [x] Implement service worker for offline support
- [x] Cache route data for offline access
- [x] Cache lead information
- [x] Add offline indicator UI
- [x] Sync data when connection restored
- [x] Add PWA manifest and meta tags
- [x] Create route download button component
- [x] Test offline functionality
- [x] Push all features to GitHub

## Push Notifications
- [x] Set up web push notification infrastructure
- [x] Request notification permissions from users
- [x] Build notification subscription management API
- [x] Create notification sending service
- [x] Add notification triggers for lead assignments
- [x] Add notification triggers for route updates
- [x] Add notification triggers for territory conflicts
- [x] Create notification preferences UI
- [x] Add notification click handlers in service worker
- [x] Test push notifications
- [x] Debug existing issues


## White-Label Version Creation
- [ ] Remove Hail Solutions Group branding from all pages
- [ ] Create generic "HailTrack CRM" branding
- [ ] Add organization/tenant management system
- [ ] Create organization settings page
- [ ] Add organization logo upload
- [ ] Add custom domain support
- [ ] Create organization onboarding flow
- [ ] Add billing integration (Stripe)
- [ ] Create customer portal for account management
- [ ] Update environment variables for multi-tenant
- [ ] Create new GitHub repository
- [ ] Push white-label version to new repo
- [ ] Document white-label setup process
