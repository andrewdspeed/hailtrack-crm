import { router } from "./_core/trpc";
import { exportDataProcedure } from "./rbac-middleware";
import { getDb } from "./db";
import { leads, vehicles, vehicleInsurance, customers } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const spreadsheetRouter = router({
  getAllWithDetails: exportDataProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    
    // Get all leads
    const allLeads = await db.select().from(leads).orderBy(desc(leads.createdAt));
    
    // Get all vehicles with their insurance
    const allVehicles = await db.select().from(vehicles);
    const allInsurance = await db.select().from(vehicleInsurance);
    
    // Map insurance by vehicleId
    const insuranceByVehicleId = new Map();
    allInsurance.forEach((i: any) => {
      insuranceByVehicleId.set(i.vehicleId, i);
    });
    
    // Map vehicles by leadId
    const vehiclesByLeadId = new Map();
    allVehicles.forEach((v: any) => {
      if (v.leadId) {
        if (!vehiclesByLeadId.has(v.leadId)) {
          vehiclesByLeadId.set(v.leadId, []);
        }
        vehiclesByLeadId.get(v.leadId).push({
          ...v,
          insurance: insuranceByVehicleId.get(v.id) || null,
        });
      }
    });
    
    // Combine all data - one row per lead with first vehicle
    return allLeads.map((lead: any) => {
      const leadVehicles = vehiclesByLeadId.get(lead.id) || [];
      const vehicle = leadVehicles[0]; // Get first vehicle
      const insurance = vehicle?.insurance;
      
      return {
        // Lead info
        id: lead.id,
        agentName: lead.agentName,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        status: lead.status,
        notes: lead.notes,
        createdAt: lead.createdAt,
        
        // Vehicle info (from first vehicle)
        vehicleYear: vehicle?.year || null,
        vehicleMake: vehicle?.make || null,
        vehicleModel: vehicle?.model || null,
        vehicleColor: vehicle?.color || null,
        vehicleVin: vehicle?.vin || null,
        vehicleStatus: vehicle?.status || null,
        glassDamage: vehicle?.glassDamage === "yes",
        
        // Insurance info
        insuranceProvider: insurance?.provider || null,
        insurancePhone: insurance?.providerPhone || null,
        insuranceClaimNumber: insurance?.claimNumber || null,
        insurancePolicyNumber: insurance?.policyNumber || null,
        adjusterName: insurance?.adjusterName || null,
        adjusterPhone: insurance?.adjusterPhone || null,
        adjusterEmail: insurance?.adjusterEmail || null,
        adjusterOfficeHours: insurance?.adjusterOfficeHours || null,
        rentalCarCompany: insurance?.rentalCompany || null,
        rentalConfirmationNumber: insurance?.rentalConfirmation || null,
        
        // Additional info
        vehicleCount: leadVehicles.length,
      };
    });
  }),
  
  // Get all customers with their vehicles for spreadsheet view
  getCustomersWithVehicles: exportDataProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    
    const allCustomers = await db.select().from(customers).orderBy(desc(customers.createdAt));
    const allVehicles = await db.select().from(vehicles);
    const allInsurance = await db.select().from(vehicleInsurance);
    
    // Map insurance by vehicleId
    const insuranceByVehicleId = new Map();
    allInsurance.forEach((i: any) => {
      insuranceByVehicleId.set(i.vehicleId, i);
    });
    
    // Map vehicles by customerId
    const vehiclesByCustomerId = new Map();
    allVehicles.forEach((v: any) => {
      if (v.customerId) {
        if (!vehiclesByCustomerId.has(v.customerId)) {
          vehiclesByCustomerId.set(v.customerId, []);
        }
        vehiclesByCustomerId.get(v.customerId).push({
          ...v,
          insurance: insuranceByVehicleId.get(v.id) || null,
        });
      }
    });
    
    // Return flat list with one row per vehicle
    const rows: any[] = [];
    
    allCustomers.forEach((customer: any) => {
      const customerVehicles = vehiclesByCustomerId.get(customer.id) || [];
      
      if (customerVehicles.length === 0) {
        // Customer with no vehicles
        rows.push({
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          customerAddress: customer.address,
          customerCity: customer.city,
          customerState: customer.state,
          vehicleId: null,
          vehicleYear: null,
          vehicleMake: null,
          vehicleModel: null,
          vehicleColor: null,
          vehicleVin: null,
          vehicleStatus: null,
          glassDamage: null,
          insuranceProvider: null,
          insuranceClaimNumber: null,
          createdAt: customer.createdAt,
        });
      } else {
        // One row per vehicle
        customerVehicles.forEach((vehicle: any) => {
          rows.push({
            customerId: customer.id,
            customerName: customer.name,
            customerPhone: customer.phone,
            customerEmail: customer.email,
            customerAddress: customer.address,
            customerCity: customer.city,
            customerState: customer.state,
            vehicleId: vehicle.id,
            vehicleYear: vehicle.year,
            vehicleMake: vehicle.make,
            vehicleModel: vehicle.model,
            vehicleColor: vehicle.color,
            vehicleVin: vehicle.vin,
            vehicleStatus: vehicle.status,
            glassDamage: vehicle.glassDamage === "yes",
            insuranceProvider: vehicle.insurance?.provider || null,
            insuranceClaimNumber: vehicle.insurance?.claimNumber || null,
            createdAt: vehicle.createdAt,
          });
        });
      }
    });
    
    return rows;
  }),
});
