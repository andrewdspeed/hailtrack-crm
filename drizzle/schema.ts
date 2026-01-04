import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================
// HAIL SOLUTIONS CRM - RESTRUCTURED SCHEMA
// ============================================

/**
 * LEADS - Potential customers (before any vehicle enters shop)
 * These are people contacted in the field who haven't converted yet
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  
  // Contact Information
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  
  // Location (for map pinning)
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  
  // Lead Status (before conversion)
  status: mysqlEnum("status", ["new", "contacted", "interested", "not_interested", "converted"]).default("new").notNull(),
  
  // Follow-up tracking
  lastFollowUpAt: timestamp("last_follow_up_at"),
  followUpResult: mysqlEnum("follow_up_result", ["no_answer", "not_interested", "interested", "scheduled"]),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  
  // Agent tracking
  agentId: int("agent_id"),
  agentName: varchar("agent_name", { length: 255 }),
  
  // Lead Source
  source: varchar("source", { length: 100 }),
  sourceDetails: text("source_details"),
  referralCode: varchar("referral_code", { length: 50 }),
  referredBy: int("referred_by"),
  
  // Notes
  notes: text("notes"),
  
  // Conversion tracking
  convertedToCustomerId: int("converted_to_customer_id"),
  convertedAt: timestamp("converted_at"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/**
 * CUSTOMERS - Converted leads (when first vehicle enters shop)
 * These are actual paying customers with repair history
 */
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  
  // Contact Information
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  
  // Address
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 20 }),
  
  // Location (for map)
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  
  // Original lead reference
  originalLeadId: int("original_lead_id"),
  
  // Agent who converted this customer
  agentId: int("agent_id"),
  agentName: varchar("agent_name", { length: 255 }),
  
  // Customer preferences
  preferredContact: mysqlEnum("preferred_contact", ["phone", "email", "text"]).default("phone"),
  
  // Notes
  notes: text("notes"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/**
 * VEHICLES - Individual repair jobs linked to customers
 * Each vehicle goes through: lead → scheduled → in_shop → awaiting_pickup → complete
 */
export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  
  // Link to customer (required for active repairs)
  customerId: int("customer_id"),
  
  // Link to lead (for vehicles added before conversion)
  leadId: int("lead_id"),
  
  // Vehicle Information
  year: varchar("year", { length: 4 }),
  make: varchar("make", { length: 100 }),
  model: varchar("model", { length: 100 }),
  color: varchar("color", { length: 50 }),
  vin: varchar("vin", { length: 17 }),
  licensePlate: varchar("license_plate", { length: 20 }),
  
  // Damage Information
  glassDamage: mysqlEnum("glass_damage", ["yes", "no"]),
  damageDescription: text("damage_description"),
  
  // Repair Status Workflow
  status: mysqlEnum("status", ["lead", "scheduled", "in_shop", "awaiting_pickup", "complete"]).default("lead").notNull(),
  subStatus: varchar("sub_status", { length: 100 }), // waiting_approval, waiting_parts, in_repair
  
  // Claim Information
  claimFiled: boolean("claim_filed").default(false),
  claimFiledDate: timestamp("claim_filed_date"),
  
  // Key Dates
  appointmentDate: timestamp("appointment_date"),
  shopDropOffDate: timestamp("shop_drop_off_date"),
  estimatedCompletionDate: timestamp("estimated_completion_date"),
  actualCompletionDate: timestamp("actual_completion_date"),
  pickupDate: timestamp("pickup_date"),
  
  // Assignment
  assignedTechnicianId: int("assigned_technician_id"),
  assignedTechnicianName: varchar("assigned_technician_name", { length: 255 }),
  
  // Loaner Vehicle
  loanerVehicleId: int("loaner_vehicle_id"),
  
  // Notes
  notes: text("notes"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/**
 * VEHICLE INSURANCE INFO - Insurance details per vehicle/claim
 */
export const vehicleInsurance = mysqlTable("vehicle_insurance", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicle_id").notNull(),
  
  // Insurance Details
  provider: varchar("provider", { length: 255 }),
  providerPhone: varchar("provider_phone", { length: 50 }),
  claimNumber: varchar("claim_number", { length: 100 }),
  policyNumber: varchar("policy_number", { length: 100 }),
  deductible: int("deductible"), // in cents
  
  // Adjuster Information
  adjusterName: varchar("adjuster_name", { length: 255 }),
  adjusterPhone: varchar("adjuster_phone", { length: 50 }),
  adjusterEmail: varchar("adjuster_email", { length: 320 }),
  adjusterOfficeHours: varchar("adjuster_office_hours", { length: 255 }),
  
  // Rental Car Information
  rentalCompany: varchar("rental_company", { length: 255 }),
  rentalConfirmation: varchar("rental_confirmation", { length: 100 }),
  rentalStartDate: timestamp("rental_start_date"),
  rentalEndDate: timestamp("rental_end_date"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/**
 * VEHICLE PHOTOS - Photos linked to specific vehicles
 */
export const vehiclePhotos = mysqlTable("vehicle_photos", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicle_id").notNull(),
  photoUrl: text("photo_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  caption: varchar("caption", { length: 255 }),
  photoType: mysqlEnum("photo_type", ["before", "during", "after", "damage", "other"]).default("other"),
  uploadedBy: varchar("uploaded_by", { length: 255 }),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

/**
 * VEHICLE DOCUMENTS - Documents linked to specific vehicles
 */
export const vehicleDocuments = mysqlTable("vehicle_documents", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicle_id").notNull(),
  documentUrl: text("document_url").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  fileSize: int("file_size"),
  category: mysqlEnum("category", ["insurance", "estimate", "invoice", "receipt", "authorization", "other"]),
  description: text("description"),
  uploadedBy: varchar("uploaded_by", { length: 255 }),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

/**
 * ESTIMATES - Linked to specific vehicles
 */
export const estimates = mysqlTable("estimates", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicle_id").notNull(),
  customerId: int("customer_id").notNull(),
  estimateNumber: varchar("estimate_number", { length: 50 }).notNull().unique(),
  status: mysqlEnum("status", ["draft", "sent", "approved", "rejected"]).default("draft"),
  subtotal: int("subtotal").notNull(),
  taxRate: int("tax_rate").default(0),
  taxAmount: int("tax_amount").default(0),
  discountAmount: int("discount_amount").default(0),
  total: int("total").notNull(),
  notes: text("notes"),
  validUntil: timestamp("valid_until"),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const estimateLineItems = mysqlTable("estimate_line_items", {
  id: int("id").autoincrement().primaryKey(),
  estimateId: int("estimate_id").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  quantity: int("quantity").notNull().default(1),
  unitPrice: int("unit_price").notNull(),
  total: int("total").notNull(),
  category: mysqlEnum("category", ["labor", "parts", "materials", "other"]).default("other"),
});

/**
 * INVOICES - Linked to specific vehicles
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicle_id").notNull(),
  customerId: int("customer_id").notNull(),
  estimateId: int("estimate_id"),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  status: mysqlEnum("status", ["draft", "sent", "paid", "partial", "overdue", "cancelled"]).default("draft"),
  subtotal: int("subtotal").notNull(),
  taxRate: int("tax_rate").default(0),
  taxAmount: int("tax_amount").default(0),
  discountAmount: int("discount_amount").default(0),
  total: int("total").notNull(),
  amountPaid: int("amount_paid").default(0),
  amountDue: int("amount_due").notNull(),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  paymentMethod: varchar("payment_method", { length: 100 }),
  paymentReference: varchar("payment_reference", { length: 255 }),
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const invoiceLineItems = mysqlTable("invoice_line_items", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoice_id").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  quantity: int("quantity").notNull().default(1),
  unitPrice: int("unit_price").notNull(),
  total: int("total").notNull(),
  category: mysqlEnum("category", ["labor", "parts", "materials", "other"]).default("other"),
});

/**
 * INSURANCE PAYMENTS - Payments from insurance companies per vehicle
 */
export const insurancePayments = mysqlTable("insurance_payments", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicle_id").notNull(),
  customerId: int("customer_id").notNull(),
  invoiceId: int("invoice_id"),
  amount: int("amount").notNull(),
  checkNumber: varchar("check_number", { length: 100 }),
  paymentDate: timestamp("payment_date"),
  receivedDate: timestamp("received_date"),
  depositedDate: timestamp("deposited_date"),
  status: mysqlEnum("status", ["pending", "received", "deposited", "cleared"]).default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/**
 * FOLLOW-UPS - Can be for leads or customers
 */
export const followUps = mysqlTable("follow_ups", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("lead_id"),
  customerId: int("customer_id"),
  vehicleId: int("vehicle_id"),
  agentId: int("agent_id").notNull(),
  agentName: varchar("agent_name", { length: 255 }).notNull(),
  stage: mysqlEnum("stage", ["lead", "scheduled", "in_shop", "awaiting_pickup", "complete", "referral"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * INSPECTIONS - Vehicle inspections
 */
export const inspections = mysqlTable("inspections", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicle_id").notNull(),
  customerId: int("customer_id"),
  inspectorId: int("inspector_id"),
  inspectorName: varchar("inspector_name", { length: 255 }),
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending"),
  
  // Inspection data (JSON for flexibility)
  exteriorCondition: text("exterior_condition"),
  interiorCondition: text("interior_condition"),
  mechanicalNotes: text("mechanical_notes"),
  damageAssessment: text("damage_assessment"),
  
  // Summary
  overallCondition: mysqlEnum("overall_condition", ["excellent", "good", "fair", "poor"]),
  estimatedRepairCost: int("estimated_repair_cost"),
  recommendations: text("recommendations"),
  
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const inspectionItems = mysqlTable("inspection_items", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspection_id").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  item: varchar("item", { length: 255 }).notNull(),
  condition: mysqlEnum("condition", ["good", "fair", "poor", "damaged", "missing"]),
  notes: text("notes"),
  photoUrl: text("photo_url"),
});

/**
 * TECHNICIANS - Repair technicians
 */
export const technicians = mysqlTable("technicians", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  specialty: varchar("specialty", { length: 255 }),
  status: mysqlEnum("status", ["active", "inactive", "on_leave"]).default("active"),
  hireDate: timestamp("hire_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/**
 * JOB ASSIGNMENTS - Technician assignments to vehicles
 */
export const jobAssignments = mysqlTable("job_assignments", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicle_id").notNull(),
  technicianId: int("technician_id").notNull(),
  assignedBy: varchar("assigned_by", { length: 255 }),
  status: mysqlEnum("status", ["assigned", "in_progress", "completed", "cancelled"]).default("assigned"),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal"),
  estimatedHours: int("estimated_hours"),
  actualHours: int("actual_hours"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/**
 * LOANER VEHICLES - Company loaner cars
 */
export const loanerVehicles = mysqlTable("loaner_vehicles", {
  id: int("id").autoincrement().primaryKey(),
  year: varchar("year", { length: 4 }),
  make: varchar("make", { length: 100 }),
  model: varchar("model", { length: 100 }),
  color: varchar("color", { length: 50 }),
  vin: varchar("vin", { length: 17 }),
  licensePlate: varchar("license_plate", { length: 20 }),
  status: mysqlEnum("status", ["available", "assigned", "maintenance", "out_of_service"]).default("available"),
  currentMileage: int("current_mileage"),
  lastServiceDate: timestamp("last_service_date"),
  nextServiceDue: timestamp("next_service_due"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/**
 * LOANER ASSIGNMENTS - Loaner vehicle assignments to customers
 */
export const loanerAssignments = mysqlTable("loaner_assignments", {
  id: int("id").autoincrement().primaryKey(),
  loanerVehicleId: int("loaner_vehicle_id").notNull(),
  customerId: int("customer_id").notNull(),
  vehicleId: int("vehicle_id"), // The customer's vehicle being repaired
  assignedBy: varchar("assigned_by", { length: 255 }),
  status: mysqlEnum("status", ["active", "returned"]).default("active"),
  mileageOut: int("mileage_out"),
  mileageIn: int("mileage_in"),
  fuelLevelOut: varchar("fuel_level_out", { length: 20 }),
  fuelLevelIn: varchar("fuel_level_in", { length: 20 }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  returnedAt: timestamp("returned_at"),
  conditionNotes: text("condition_notes"),
});

/**
 * TAGS - For categorizing leads/customers/vehicles
 */
export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leadTags = mysqlTable("lead_tags", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("lead_id").notNull(),
  tagId: int("tag_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customerTags = mysqlTable("customer_tags", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customer_id").notNull(),
  tagId: int("tag_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * TEXT TEMPLATES - SMS/Email templates
 */
export const textTemplates = mysqlTable("text_templates", {
  id: int("id").autoincrement().primaryKey(),
  stage: mysqlEnum("stage", ["lead", "scheduled", "in_shop", "awaiting_pickup", "complete", "referral"]).notNull().unique(),
  template: text("template").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/**
 * REMINDERS - Automated reminders
 */
export const reminders = mysqlTable("reminders", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("lead_id"),
  customerId: int("customer_id"),
  vehicleId: int("vehicle_id"),
  reminderType: mysqlEnum("reminder_type", ["appointment", "payment_due", "inspection_followup", "pickup_ready", "custom"]).notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed", "cancelled"]).default("pending").notNull(),
  sentAt: timestamp("sent_at"),
  method: mysqlEnum("method", ["sms", "email", "both"]).default("sms").notNull(),
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * CUSTOMER PORTAL ACCESS - For customer self-service
 */
export const customerPortalAccess = mysqlTable("customer_portal_access", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customer_id").notNull(),
  accessToken: varchar("access_token", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  isActive: boolean("is_active").default(true).notNull(),
  lastAccessAt: timestamp("last_access_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by", { length: 255 }),
});

/**
 * CUSTOMER MESSAGES - Communication between staff and customers
 */
export const customerMessages = mysqlTable("customer_messages", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customer_id").notNull(),
  vehicleId: int("vehicle_id"),
  senderType: mysqlEnum("sender_type", ["customer", "staff"]).notNull(),
  senderName: varchar("sender_name", { length: 255 }),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * RBAC - Roles and Permissions
 */
export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const permissions = mysqlTable("permissions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userRoles = mysqlTable("user_roles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  roleId: int("role_id").notNull(),
  assignedBy: varchar("assigned_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userPermissions = mysqlTable("user_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  permissionId: int("permission_id").notNull(),
  grantedBy: varchar("granted_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rolePermissions = mysqlTable("role_permissions", {
  id: int("id").autoincrement().primaryKey(),
  roleId: int("role_id").notNull(),
  permissionId: int("permission_id").notNull(),
});

/**
 * USER CALENDAR TOKENS - Google Calendar OAuth tokens
 */
export const userCalendarTokens = mysqlTable("user_calendar_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/**
 * LEAD CALENDAR EVENTS - Calendar events linked to leads
 */
export const leadCalendarEvents = mysqlTable("lead_calendar_events", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("lead_id").notNull(),
  vehicleId: int("vehicle_id"),
  eventId: varchar("event_id", { length: 255 }).notNull(),
  eventType: mysqlEnum("event_type", ["appointment", "follow_up", "pickup", "other"]).default("appointment"),
  title: varchar("title", { length: 255 }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;
export type VehicleInsurance = typeof vehicleInsurance.$inferSelect;
export type InsertVehicleInsurance = typeof vehicleInsurance.$inferInsert;
export type VehiclePhoto = typeof vehiclePhotos.$inferSelect;
export type InsertVehiclePhoto = typeof vehiclePhotos.$inferInsert;
export type VehicleDocument = typeof vehicleDocuments.$inferSelect;
export type InsertVehicleDocument = typeof vehicleDocuments.$inferInsert;
export type Estimate = typeof estimates.$inferSelect;
export type InsertEstimate = typeof estimates.$inferInsert;
export type EstimateLineItem = typeof estimateLineItems.$inferSelect;
export type InsertEstimateLineItem = typeof estimateLineItems.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type InsertInvoiceLineItem = typeof invoiceLineItems.$inferInsert;
export type InsurancePayment = typeof insurancePayments.$inferSelect;
export type InsertInsurancePayment = typeof insurancePayments.$inferInsert;
export type FollowUp = typeof followUps.$inferSelect;
export type InsertFollowUp = typeof followUps.$inferInsert;
export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;
export type InspectionItem = typeof inspectionItems.$inferSelect;
export type InsertInspectionItem = typeof inspectionItems.$inferInsert;
export type Technician = typeof technicians.$inferSelect;
export type InsertTechnician = typeof technicians.$inferInsert;
export type JobAssignment = typeof jobAssignments.$inferSelect;
export type InsertJobAssignment = typeof jobAssignments.$inferInsert;
export type LoanerVehicle = typeof loanerVehicles.$inferSelect;
export type InsertLoanerVehicle = typeof loanerVehicles.$inferInsert;
export type LoanerAssignment = typeof loanerAssignments.$inferSelect;
export type InsertLoanerAssignment = typeof loanerAssignments.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;
export type LeadTag = typeof leadTags.$inferSelect;
export type InsertLeadTag = typeof leadTags.$inferInsert;
export type CustomerTag = typeof customerTags.$inferSelect;
export type InsertCustomerTag = typeof customerTags.$inferInsert;
export type TextTemplate = typeof textTemplates.$inferSelect;
export type InsertTextTemplate = typeof textTemplates.$inferInsert;
export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;
export type CustomerPortalAccess = typeof customerPortalAccess.$inferSelect;
export type InsertCustomerPortalAccess = typeof customerPortalAccess.$inferInsert;
export type CustomerMessage = typeof customerMessages.$inferSelect;
export type InsertCustomerMessage = typeof customerMessages.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;
export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;

// ============================================
// ROUTE TRACKING & COORDINATION
// ============================================

/**
 * ACTIVE ROUTES - Real-time tracking of agents' active routes
 */
export const activeRoutes = mysqlTable("active_routes", {
  id: int("id").autoincrement().primaryKey(),
  
  // Agent information
  agentId: int("agent_id").notNull(),
  agentName: varchar("agent_name", { length: 255 }).notNull(),
  
  // Route details
  routeName: varchar("route_name", { length: 255 }).notNull(),
  routeType: varchar("route_type", { length: 100 }), // "high_priority", "medium_priority", "nearby"
  priority: int("priority").default(5),
  
  // Route metrics
  totalStops: int("total_stops").notNull(),
  completedStops: int("completed_stops").default(0),
  totalDistance: decimal("total_distance", { precision: 10, scale: 2 }), // in km
  estimatedTime: int("estimated_time"), // in minutes
  
  // Current location
  currentLatitude: varchar("current_latitude", { length: 50 }),
  currentLongitude: varchar("current_longitude", { length: 50 }),
  lastLocationUpdate: timestamp("last_location_update"),
  
  // Route status
  status: mysqlEnum("status", ["active", "paused", "completed", "cancelled"]).default("active").notNull(),
  
  // Territory
  territoryId: int("territory_id"),
  
  // Timestamps
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ActiveRoute = typeof activeRoutes.$inferSelect;
export type InsertActiveRoute = typeof activeRoutes.$inferInsert;

/**
 * ROUTE STOPS - Individual stops in an active route
 */
export const routeStops = mysqlTable("route_stops", {
  id: int("id").autoincrement().primaryKey(),
  
  // Route reference
  routeId: int("route_id").notNull(),
  
  // Stop details
  leadId: int("lead_id").notNull(),
  stopOrder: int("stop_order").notNull(), // 1, 2, 3, etc.
  
  // Location
  latitude: varchar("latitude", { length: 50 }).notNull(),
  longitude: varchar("longitude", { length: 50 }).notNull(),
  address: text("address").notNull(),
  
  // Stop status
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "skipped"]).default("pending").notNull(),
  
  // Timing
  estimatedArrival: timestamp("estimated_arrival"),
  actualArrival: timestamp("actual_arrival"),
  departureTime: timestamp("departure_time"),
  timeSpent: int("time_spent"), // in minutes
  
  // Outcome
  outcome: mysqlEnum("outcome", ["converted", "follow_up", "not_interested", "no_answer"]),
  notes: text("notes"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type RouteStop = typeof routeStops.$inferSelect;
export type InsertRouteStop = typeof routeStops.$inferInsert;

/**
 * ROUTE HISTORY - Completed routes for analytics
 */
export const routeHistory = mysqlTable("route_history", {
  id: int("id").autoincrement().primaryKey(),
  
  // Agent information
  agentId: int("agent_id").notNull(),
  agentName: varchar("agent_name", { length: 255 }).notNull(),
  
  // Route details
  routeName: varchar("route_name", { length: 255 }).notNull(),
  routeType: varchar("route_type", { length: 100 }),
  priority: int("priority"),
  
  // Metrics
  totalStops: int("total_stops").notNull(),
  completedStops: int("completed_stops").notNull(),
  skippedStops: int("skipped_stops").default(0),
  
  // Distance and time
  plannedDistance: decimal("planned_distance", { precision: 10, scale: 2 }), // in km
  actualDistance: decimal("actual_distance", { precision: 10, scale: 2 }),
  estimatedTime: int("estimated_time"), // in minutes
  actualTime: int("actual_time"), // in minutes
  
  // Performance metrics
  conversions: int("conversions").default(0),
  followUps: int("follow_ups").default(0),
  notInterested: int("not_interested").default(0),
  noAnswers: int("no_answers").default(0),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }), // percentage
  
  // Territory
  territoryId: int("territory_id"),
  
  // Timestamps
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at").notNull(),
  duration: int("duration"), // in minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RouteHistory = typeof routeHistory.$inferSelect;
export type InsertRouteHistory = typeof routeHistory.$inferInsert;

/**
 * AGENT LOCATIONS - Real-time location tracking
 */
export const agentLocations = mysqlTable("agent_locations", {
  id: int("id").autoincrement().primaryKey(),
  
  // Agent information
  agentId: int("agent_id").notNull(),
  agentName: varchar("agent_name", { length: 255 }).notNull(),
  
  // Location
  latitude: varchar("latitude", { length: 50 }).notNull(),
  longitude: varchar("longitude", { length: 50 }).notNull(),
  accuracy: decimal("accuracy", { precision: 10, scale: 2 }), // in meters
  
  // Status
  isActive: boolean("is_active").default(true),
  activeRouteId: int("active_route_id"),
  
  // Timestamps
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Location expires after 5 minutes of no updates
});

export type AgentLocation = typeof agentLocations.$inferSelect;
export type InsertAgentLocation = typeof agentLocations.$inferInsert;

/**
 * TERRITORIES - Geographic boundaries for route coordination
 */
export const territories = mysqlTable("territories", {
  id: int("id").autoincrement().primaryKey(),
  
  // Territory details
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }), // hex color code
  
  // Boundary (stored as JSON polygon coordinates)
  boundaryCoordinates: text("boundary_coordinates").notNull(), // JSON array of {lat, lng}
  
  // Assignment
  assignedAgentId: int("assigned_agent_id"),
  assignedAgentName: varchar("assigned_agent_name", { length: 255 }),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Territory = typeof territories.$inferSelect;
export type InsertTerritory = typeof territories.$inferInsert;
