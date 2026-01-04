import { eq, and, desc, sql, gte, lte, like, or, inArray, isNull, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  leads, InsertLead, Lead,
  customers, InsertCustomer, Customer,
  vehicles, InsertVehicle, Vehicle,
  vehicleInsurance, InsertVehicleInsurance,
  vehiclePhotos, InsertVehiclePhoto,
  vehicleDocuments, InsertVehicleDocument,
  followUps, InsertFollowUp,
  textTemplates, InsertTextTemplate,
  estimates, InsertEstimate, estimateLineItems, InsertEstimateLineItem,
  invoices, InsertInvoice, invoiceLineItems, InsertInvoiceLineItem,
  insurancePayments, InsertInsurancePayment,
  tags, InsertTag, leadTags, InsertLeadTag, customerTags, InsertCustomerTag,
  inspections, InsertInspection, inspectionItems, InsertInspectionItem,
  technicians, InsertTechnician, jobAssignments, InsertJobAssignment,
  loanerVehicles, InsertLoanerVehicle, loanerAssignments, InsertLoanerAssignment,
  roles, permissions, userRoles, userPermissions, rolePermissions,
  reminders, InsertReminder,
  customerPortalAccess, InsertCustomerPortalAccess,
  customerMessages, InsertCustomerMessage,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ===== USER MANAGEMENT =====

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== LEADS (Potential Customers) =====

export async function createLead(lead: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leads).values(lead);
  return result;
}

export async function getAllLeads() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(leads).orderBy(desc(leads.createdAt));
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateLead(id: number, data: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads).set(data).where(eq(leads.id, id));
}

export async function deleteLead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(leads).where(eq(leads.id, id));
}

export async function getLeadsByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(leads).where(eq(leads.status, status as any)).orderBy(desc(leads.createdAt));
}

export async function getLeadsByAgent(agentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(leads).where(eq(leads.agentId, agentId)).orderBy(desc(leads.createdAt));
}

export async function convertLeadToCustomer(leadId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const lead = await getLeadById(leadId);
  if (!lead) throw new Error("Lead not found");
  
  // Create customer from lead data
  const customerResult = await db.insert(customers).values({
    name: lead.name || "Unknown",
    phone: lead.phone,
    email: lead.email,
    address: lead.address,
    city: lead.city,
    state: lead.state,
    latitude: lead.latitude,
    longitude: lead.longitude,
    originalLeadId: leadId,
    agentId: lead.agentId,
    agentName: lead.agentName,
    notes: lead.notes,
  });
  
  const customerId = Number((customerResult as any).insertId);
  
  // Update lead to mark as converted
  await db.update(leads).set({
    status: "converted",
    convertedToCustomerId: customerId,
    convertedAt: new Date(),
  }).where(eq(leads.id, leadId));
  
  // Transfer any vehicles from lead to customer
  await db.update(vehicles).set({
    customerId: customerId,
  }).where(eq(vehicles.leadId, leadId));
  
  return customerId;
}

// ===== CUSTOMERS (Converted Leads) =====

export async function createCustomer(customer: InsertCustomer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(customers).values(customer);
  return result;
}

export async function getAllCustomers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(customers).orderBy(desc(customers.createdAt));
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCustomer(id: number, data: Partial<InsertCustomer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(customers).set(data).where(eq(customers.id, id));
}

export async function deleteCustomer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(customers).where(eq(customers.id, id));
}

export async function getCustomerWithVehicles(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const customer = await getCustomerById(id);
  if (!customer) return undefined;
  
  const customerVehicles = await db.select().from(vehicles).where(eq(vehicles.customerId, id)).orderBy(desc(vehicles.createdAt));
  
  return {
    ...customer,
    vehicles: customerVehicles,
  };
}

// ===== VEHICLES (Repair Jobs) =====

export async function createVehicle(vehicle: InsertVehicle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(vehicles).values(vehicle);
  return result;
}

export async function getAllVehicles() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(vehicles).orderBy(desc(vehicles.createdAt));
}

export async function getVehicleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateVehicle(id: number, data: Partial<InsertVehicle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(vehicles).set(data).where(eq(vehicles.id, id));
}

export async function deleteVehicle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(vehicles).where(eq(vehicles.id, id));
}

export async function getVehiclesByCustomerId(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(vehicles).where(eq(vehicles.customerId, customerId)).orderBy(desc(vehicles.createdAt));
}

export async function getVehiclesByLeadId(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(vehicles).where(eq(vehicles.leadId, leadId)).orderBy(desc(vehicles.createdAt));
}

export async function getVehiclesByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(vehicles).where(eq(vehicles.status, status as any)).orderBy(desc(vehicles.createdAt));
}

export async function updateVehicleStatus(id: number, status: string, subStatus?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  if (subStatus !== undefined) updateData.subStatus = subStatus;
  
  // Set appropriate dates based on status
  if (status === "in_shop") {
    updateData.shopDropOffDate = new Date();
  } else if (status === "complete") {
    updateData.actualCompletionDate = new Date();
  } else if (status === "awaiting_pickup") {
    updateData.actualCompletionDate = new Date();
  }
  
  await db.update(vehicles).set(updateData).where(eq(vehicles.id, id));
}

export async function getVehicleWithDetails(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const vehicle = await getVehicleById(id);
  if (!vehicle) return undefined;
  
  const insurance = await db.select().from(vehicleInsurance).where(eq(vehicleInsurance.vehicleId, id)).limit(1);
  const photos = await db.select().from(vehiclePhotos).where(eq(vehiclePhotos.vehicleId, id)).orderBy(desc(vehiclePhotos.uploadedAt));
  const documents = await db.select().from(vehicleDocuments).where(eq(vehicleDocuments.vehicleId, id)).orderBy(desc(vehicleDocuments.uploadedAt));
  const vehicleEstimates = await db.select().from(estimates).where(eq(estimates.vehicleId, id)).orderBy(desc(estimates.createdAt));
  const vehicleInvoices = await db.select().from(invoices).where(eq(invoices.vehicleId, id)).orderBy(desc(invoices.createdAt));
  const vehicleInspections = await db.select().from(inspections).where(eq(inspections.vehicleId, id)).orderBy(desc(inspections.createdAt));
  const assignments = await db.select().from(jobAssignments).where(eq(jobAssignments.vehicleId, id)).orderBy(desc(jobAssignments.createdAt));
  
  let customer = null;
  if (vehicle.customerId) {
    customer = await getCustomerById(vehicle.customerId);
  }
  
  let lead = null;
  if (vehicle.leadId) {
    lead = await getLeadById(vehicle.leadId);
  }
  
  return {
    ...vehicle,
    customer,
    lead,
    insurance: insurance.length > 0 ? insurance[0] : null,
    photos,
    documents,
    estimates: vehicleEstimates,
    invoices: vehicleInvoices,
    inspections: vehicleInspections,
    assignments,
  };
}

// ===== VEHICLE INSURANCE =====

export async function createVehicleInsurance(insurance: InsertVehicleInsurance) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(vehicleInsurance).values(insurance);
  return result;
}

export async function getVehicleInsurance(vehicleId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(vehicleInsurance).where(eq(vehicleInsurance.vehicleId, vehicleId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateVehicleInsurance(vehicleId: number, data: Partial<InsertVehicleInsurance>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(vehicleInsurance).set(data).where(eq(vehicleInsurance.vehicleId, vehicleId));
}

export async function upsertVehicleInsurance(vehicleId: number, data: InsertVehicleInsurance) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getVehicleInsurance(vehicleId);
  if (existing) {
    await updateVehicleInsurance(vehicleId, data);
  } else {
    await createVehicleInsurance({ ...data, vehicleId });
  }
}

// ===== VEHICLE PHOTOS =====

export async function createVehiclePhoto(photo: InsertVehiclePhoto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(vehiclePhotos).values(photo);
  return result;
}

export async function getPhotosByVehicleId(vehicleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(vehiclePhotos).where(eq(vehiclePhotos.vehicleId, vehicleId)).orderBy(desc(vehiclePhotos.uploadedAt));
}

export async function deleteVehiclePhoto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(vehiclePhotos).where(eq(vehiclePhotos.id, id));
}

// Legacy compatibility - map to vehicle photos
export async function getPhotosByLeadId(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get vehicles for this lead and return their photos
  const leadVehicles = await getVehiclesByLeadId(leadId);
  if (leadVehicles.length === 0) return [];
  const vehicleIds = leadVehicles.map(v => v.id);
  return await db.select().from(vehiclePhotos).where(inArray(vehiclePhotos.vehicleId, vehicleIds)).orderBy(desc(vehiclePhotos.uploadedAt));
}

export async function createLeadPhoto(photo: { leadId: number; photoUrl: string; thumbnailUrl?: string; caption?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Get first vehicle for this lead, or create one
  const leadVehicles = await getVehiclesByLeadId(photo.leadId);
  let vehicleId: number;
  if (leadVehicles.length > 0) {
    vehicleId = leadVehicles[0].id;
  } else {
    const result = await createVehicle({ leadId: photo.leadId });
    vehicleId = Number((result as any).insertId);
  }
  return await createVehiclePhoto({
    vehicleId,
    photoUrl: photo.photoUrl,
    thumbnailUrl: photo.thumbnailUrl,
    caption: photo.caption,
  });
}

export async function deleteLeadPhoto(id: number) {
  return await deleteVehiclePhoto(id);
}

// ===== VEHICLE DOCUMENTS =====

export async function createVehicleDocument(doc: InsertVehicleDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(vehicleDocuments).values(doc);
  return result;
}

export async function getDocumentsByVehicleId(vehicleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(vehicleDocuments).where(eq(vehicleDocuments.vehicleId, vehicleId)).orderBy(desc(vehicleDocuments.uploadedAt));
}

export async function deleteVehicleDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(vehicleDocuments).where(eq(vehicleDocuments.id, id));
}

// Legacy compatibility
export async function getDocumentsByLeadId(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  const leadVehicles = await getVehiclesByLeadId(leadId);
  if (leadVehicles.length === 0) return [];
  const vehicleIds = leadVehicles.map(v => v.id);
  return await db.select().from(vehicleDocuments).where(inArray(vehicleDocuments.vehicleId, vehicleIds)).orderBy(desc(vehicleDocuments.uploadedAt));
}

export async function createLeadDocument(doc: { leadId: number; documentUrl: string; filename: string; fileType: string; fileSize?: number; category?: any; description?: string; uploadedBy?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const leadVehicles = await getVehiclesByLeadId(doc.leadId);
  let vehicleId: number;
  if (leadVehicles.length > 0) {
    vehicleId = leadVehicles[0].id;
  } else {
    const result = await createVehicle({ leadId: doc.leadId });
    vehicleId = Number((result as any).insertId);
  }
  return await createVehicleDocument({
    vehicleId,
    documentUrl: doc.documentUrl,
    filename: doc.filename,
    fileType: doc.fileType,
    fileSize: doc.fileSize,
    category: doc.category,
    description: doc.description,
    uploadedBy: doc.uploadedBy,
  });
}

export async function deleteLeadDocument(id: number) {
  return await deleteVehicleDocument(id);
}

// ===== ESTIMATES =====

export async function createEstimate(estimate: Omit<InsertEstimate, 'estimateNumber'>, lineItems: InsertEstimateLineItem[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Generate estimate number
  const estimateNumber = `EST-${Date.now()}`;
  
  const result = await db.insert(estimates).values({
    ...estimate,
    estimateNumber,
  });
  
  const estimateId = Number((result as any).insertId);
  
  // Insert line items
  if (lineItems.length > 0) {
    await db.insert(estimateLineItems).values(
      lineItems.map(item => ({ ...item, estimateId }))
    );
  }
  
  return { id: estimateId, estimateNumber };
}

export async function getEstimatesByVehicleId(vehicleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(estimates).where(eq(estimates.vehicleId, vehicleId)).orderBy(desc(estimates.createdAt));
}

export async function getEstimateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(estimates).where(eq(estimates.id, id)).limit(1);
  if (result.length === 0) return undefined;
  
  const items = await db.select().from(estimateLineItems).where(eq(estimateLineItems.estimateId, id));
  return { ...result[0], lineItems: items };
}

export async function updateEstimateStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(estimates).set({ status: status as any }).where(eq(estimates.id, id));
}

export async function deleteEstimate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(estimateLineItems).where(eq(estimateLineItems.estimateId, id));
  await db.delete(estimates).where(eq(estimates.id, id));
}

// Legacy compatibility
export async function getEstimatesByLeadId(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  const leadVehicles = await getVehiclesByLeadId(leadId);
  if (leadVehicles.length === 0) return [];
  const vehicleIds = leadVehicles.map(v => v.id);
  return await db.select().from(estimates).where(inArray(estimates.vehicleId, vehicleIds)).orderBy(desc(estimates.createdAt));
}

// ===== INVOICES =====

export async function createInvoice(invoice: Omit<InsertInvoice, 'invoiceNumber'>, lineItems: InsertInvoiceLineItem[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const invoiceNumber = `INV-${Date.now()}`;
  
  const result = await db.insert(invoices).values({
    ...invoice,
    invoiceNumber,
  });
  
  const invoiceId = Number((result as any).insertId);
  
  if (lineItems.length > 0) {
    await db.insert(invoiceLineItems).values(
      lineItems.map(item => ({ ...item, invoiceId }))
    );
  }
  
  return { id: invoiceId, invoiceNumber };
}

export async function getInvoicesByVehicleId(vehicleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(invoices).where(eq(invoices.vehicleId, vehicleId)).orderBy(desc(invoices.createdAt));
}

export async function getInvoiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (result.length === 0) return undefined;
  
  const items = await db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, id));
  return { ...result[0], lineItems: items };
}

export async function updateInvoicePayment(id: number, amount: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const invoice = await getInvoiceById(id);
  if (!invoice) throw new Error("Invoice not found");
  
  const newAmountPaid = (invoice.amountPaid || 0) + amount;
  const newAmountDue = invoice.total - newAmountPaid;
  const newStatus = newAmountDue <= 0 ? "paid" : newAmountPaid > 0 ? "partial" : invoice.status;
  
  await db.update(invoices).set({
    amountPaid: newAmountPaid,
    amountDue: newAmountDue,
    status: newStatus as any,
    paidDate: newAmountDue <= 0 ? new Date() : null,
  }).where(eq(invoices.id, id));
}

export async function convertEstimateToInvoice(estimateId: number, dueDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const estimate = await getEstimateById(estimateId);
  if (!estimate) throw new Error("Estimate not found");
  
  const invoiceNumber = `INV-${Date.now()}`;
  
  const result = await db.insert(invoices).values({
    vehicleId: estimate.vehicleId,
    customerId: estimate.customerId,
    estimateId: estimateId,
    invoiceNumber,
    status: "draft",
    subtotal: estimate.subtotal,
    taxRate: estimate.taxRate,
    taxAmount: estimate.taxAmount,
    discountAmount: estimate.discountAmount,
    total: estimate.total,
    amountPaid: 0,
    amountDue: estimate.total,
    dueDate: dueDate || null,
    createdBy: estimate.createdBy,
  });
  
  const invoiceId = Number((result as any).insertId);
  
  if (estimate.lineItems.length > 0) {
    await db.insert(invoiceLineItems).values(
      estimate.lineItems.map(item => ({
        invoiceId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        category: item.category,
      }))
    );
  }
  
  return { id: invoiceId, invoiceNumber };
}

// Legacy compatibility
export async function getInvoicesByLeadId(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  const leadVehicles = await getVehiclesByLeadId(leadId);
  if (leadVehicles.length === 0) return [];
  const vehicleIds = leadVehicles.map(v => v.id);
  return await db.select().from(invoices).where(inArray(invoices.vehicleId, vehicleIds)).orderBy(desc(invoices.createdAt));
}

// ===== FOLLOW-UPS =====

export async function createFollowUp(followUp: InsertFollowUp) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(followUps).values(followUp);
  return result;
}

export async function getFollowUpsByLeadId(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(followUps).where(eq(followUps.leadId, leadId)).orderBy(desc(followUps.createdAt));
}

export async function getFollowUpsByCustomerId(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(followUps).where(eq(followUps.customerId, customerId)).orderBy(desc(followUps.createdAt));
}

export async function getFollowUpsByVehicleId(vehicleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(followUps).where(eq(followUps.vehicleId, vehicleId)).orderBy(desc(followUps.createdAt));
}

// ===== TEXT TEMPLATES =====

export async function getTextTemplateByStage(stage: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(textTemplates).where(eq(textTemplates.stage, stage as any)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllTextTemplates() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(textTemplates);
}

export async function upsertTextTemplate(stage: string, template: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(textTemplates).values({
    stage: stage as any,
    template,
  }).onDuplicateKeyUpdate({
    set: { template },
  });
}

// ===== TAGS =====

export async function getAllTags() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tags).orderBy(tags.name);
}

export async function createTag(tag: InsertTag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tags).values(tag);
  return result;
}

export async function deleteTag(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(leadTags).where(eq(leadTags.tagId, id));
  await db.delete(customerTags).where(eq(customerTags.tagId, id));
  await db.delete(tags).where(eq(tags.id, id));
}

export async function addTagToLead(leadId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(leadTags).values({ leadId, tagId }).onDuplicateKeyUpdate({ set: { tagId } });
}

export async function removeTagFromLead(leadId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(leadTags).where(and(eq(leadTags.leadId, leadId), eq(leadTags.tagId, tagId)));
}

export async function getLeadTags(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ tag: tags }).from(leadTags).innerJoin(tags, eq(leadTags.tagId, tags.id)).where(eq(leadTags.leadId, leadId));
  return result.map(r => r.tag);
}

export async function addTagToCustomer(customerId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(customerTags).values({ customerId, tagId }).onDuplicateKeyUpdate({ set: { tagId } });
}

export async function removeTagFromCustomer(customerId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(customerTags).where(and(eq(customerTags.customerId, customerId), eq(customerTags.tagId, tagId)));
}

export async function getCustomerTags(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ tag: tags }).from(customerTags).innerJoin(tags, eq(customerTags.tagId, tags.id)).where(eq(customerTags.customerId, customerId));
  return result.map(r => r.tag);
}

// ===== BULK OPERATIONS =====

export async function bulkUpdateLeadStatus(leadIds: number[], status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads).set({ status: status as any }).where(inArray(leads.id, leadIds));
}

export async function bulkAddTagToLeads(leadIds: number[], tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  for (const leadId of leadIds) {
    await addTagToLead(leadId, tagId);
  }
}

export async function bulkRemoveTagFromLeads(leadIds: number[], tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(leadTags).where(and(inArray(leadTags.leadId, leadIds), eq(leadTags.tagId, tagId)));
}

// ===== INSPECTIONS =====

export async function createInspection(inspection: InsertInspection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(inspections).values(inspection);
  return result;
}

export async function getInspectionsByVehicleId(vehicleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(inspections).where(eq(inspections.vehicleId, vehicleId)).orderBy(desc(inspections.createdAt));
}

export async function getInspectionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inspections).where(eq(inspections.id, id)).limit(1);
  if (result.length === 0) return undefined;
  
  const items = await db.select().from(inspectionItems).where(eq(inspectionItems.inspectionId, id));
  return { ...result[0], items };
}

export async function updateInspection(id: number, data: Partial<InsertInspection>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(inspections).set(data).where(eq(inspections.id, id));
}

export async function addInspectionItem(item: InsertInspectionItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(inspectionItems).values(item);
}

// Legacy compatibility
export async function getInspectionsByLeadId(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  const leadVehicles = await getVehiclesByLeadId(leadId);
  if (leadVehicles.length === 0) return [];
  const vehicleIds = leadVehicles.map(v => v.id);
  return await db.select().from(inspections).where(inArray(inspections.vehicleId, vehicleIds)).orderBy(desc(inspections.createdAt));
}

// ===== TECHNICIANS =====

export async function createTechnician(technician: InsertTechnician) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(technicians).values(technician);
  return result;
}

export async function getAllTechnicians() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(technicians).orderBy(technicians.name);
}

export async function getTechnicianById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(technicians).where(eq(technicians.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateTechnician(id: number, data: Partial<InsertTechnician>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(technicians).set(data).where(eq(technicians.id, id));
}

export async function deleteTechnician(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(technicians).where(eq(technicians.id, id));
}

// ===== JOB ASSIGNMENTS =====

export async function createJobAssignment(assignment: InsertJobAssignment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(jobAssignments).values(assignment);
  return result;
}

export async function getJobAssignmentsByVehicleId(vehicleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(jobAssignments).where(eq(jobAssignments.vehicleId, vehicleId)).orderBy(desc(jobAssignments.createdAt));
}

export async function getJobAssignmentsByTechnicianId(technicianId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(jobAssignments).where(eq(jobAssignments.technicianId, technicianId)).orderBy(desc(jobAssignments.createdAt));
}

export async function updateJobAssignment(id: number, data: Partial<InsertJobAssignment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(jobAssignments).set(data).where(eq(jobAssignments.id, id));
}

// ===== LOANER VEHICLES =====

export async function createLoanerVehicle(loaner: InsertLoanerVehicle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(loanerVehicles).values(loaner);
  return result;
}

export async function getAllLoanerVehicles() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(loanerVehicles).orderBy(loanerVehicles.make);
}

export async function getLoanerVehicleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(loanerVehicles).where(eq(loanerVehicles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateLoanerVehicle(id: number, data: Partial<InsertLoanerVehicle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(loanerVehicles).set(data).where(eq(loanerVehicles.id, id));
}

export async function deleteLoanerVehicle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(loanerVehicles).where(eq(loanerVehicles.id, id));
}

export async function getAvailableLoanerVehicles() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(loanerVehicles).where(eq(loanerVehicles.status, "available"));
}

// ===== LOANER ASSIGNMENTS =====

export async function createLoanerAssignment(assignment: InsertLoanerAssignment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Update loaner vehicle status
  await db.update(loanerVehicles).set({ status: "assigned" }).where(eq(loanerVehicles.id, assignment.loanerVehicleId));
  
  const result = await db.insert(loanerAssignments).values(assignment);
  return result;
}

export async function getLoanerAssignmentsByCustomerId(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(loanerAssignments).where(eq(loanerAssignments.customerId, customerId)).orderBy(desc(loanerAssignments.assignedAt));
}

export async function returnLoanerVehicle(assignmentId: number, mileageIn: number, fuelLevelIn: string, conditionNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const assignment = await db.select().from(loanerAssignments).where(eq(loanerAssignments.id, assignmentId)).limit(1);
  if (assignment.length === 0) throw new Error("Assignment not found");
  
  // Update assignment
  await db.update(loanerAssignments).set({
    status: "returned",
    mileageIn,
    fuelLevelIn,
    conditionNotes,
    returnedAt: new Date(),
  }).where(eq(loanerAssignments.id, assignmentId));
  
  // Update loaner vehicle status and mileage
  await db.update(loanerVehicles).set({
    status: "available",
    currentMileage: mileageIn,
  }).where(eq(loanerVehicles.id, assignment[0].loanerVehicleId));
}

// ===== RBAC =====

export async function getAllRoles() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(roles);
}

export async function getAllPermissions() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(permissions);
}

export async function getUserRoles(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ role: roles }).from(userRoles).innerJoin(roles, eq(userRoles.roleId, roles.id)).where(eq(userRoles.userId, userId));
  return result.map(r => r.role);
}

export async function getUserPermissions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ permission: permissions }).from(userPermissions).innerJoin(permissions, eq(userPermissions.permissionId, permissions.id)).where(eq(userPermissions.userId, userId));
  return result.map(r => r.permission);
}

export async function assignRoleToUser(userId: number, roleId: number, assignedBy?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(userRoles).values({ userId, roleId, assignedBy }).onDuplicateKeyUpdate({ set: { assignedBy } });
}

export async function removeRoleFromUser(userId: number, roleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
}

export async function grantPermissionToUser(userId: number, permissionId: number, grantedBy?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(userPermissions).values({ userId, permissionId, grantedBy }).onDuplicateKeyUpdate({ set: { grantedBy } });
}

export async function revokePermissionFromUser(userId: number, permissionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userPermissions).where(and(eq(userPermissions.userId, userId), eq(userPermissions.permissionId, permissionId)));
}

export async function getRolePermissions(roleId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ permission: permissions }).from(rolePermissions).innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id)).where(eq(rolePermissions.roleId, roleId));
  return result.map(r => r.permission);
}

// ===== ANALYTICS HELPERS =====

export async function getLeadStats() {
  const db = await getDb();
  if (!db) return { total: 0, new: 0, contacted: 0, interested: 0, converted: 0 };
  
  const total = await db.select({ count: sql<number>`count(*)` }).from(leads);
  const byStatus = await db.select({ 
    status: leads.status, 
    count: sql<number>`count(*)` 
  }).from(leads).groupBy(leads.status);
  
  const stats: any = { total: Number(total[0]?.count || 0), new: 0, contacted: 0, interested: 0, converted: 0 };
  byStatus.forEach(s => {
    stats[s.status] = Number(s.count);
  });
  
  return stats;
}

export async function getVehicleStats() {
  const db = await getDb();
  if (!db) return { total: 0, lead: 0, scheduled: 0, in_shop: 0, awaiting_pickup: 0, complete: 0 };
  
  const total = await db.select({ count: sql<number>`count(*)` }).from(vehicles);
  const byStatus = await db.select({ 
    status: vehicles.status, 
    count: sql<number>`count(*)` 
  }).from(vehicles).groupBy(vehicles.status);
  
  const stats: any = { total: Number(total[0]?.count || 0), lead: 0, scheduled: 0, in_shop: 0, awaiting_pickup: 0, complete: 0 };
  byStatus.forEach(s => {
    stats[s.status] = Number(s.count);
  });
  
  return stats;
}

export async function getCustomerStats() {
  const db = await getDb();
  if (!db) return { total: 0 };
  
  const total = await db.select({ count: sql<number>`count(*)` }).from(customers);
  return { total: Number(total[0]?.count || 0) };
}

// Export db for direct access if needed
export { getDb as db };
