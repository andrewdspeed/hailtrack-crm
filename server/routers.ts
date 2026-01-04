import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { notificationRouter } from "./notification-router";
import { inspectionRouter } from "./inspection-router";
import { customersRouter } from "./customers-router";
import { messagingRouter } from "./messaging-router";
import { hailReconRouter } from "./hail-recon-router";
import { calendarRouter } from "./calendar-routers";
import { spreadsheetRouter } from "./spreadsheet-router";
import { analyticsRouter } from "./analytics-router";
import { rbacRouter } from "./rbac-router";
import { loanerRouter } from "./loaner-router";
import { technicianRouter } from "./technician-router";
import {
  financialViewProcedure,
  financialEditProcedure,
  paymentApproveProcedure,
  invoiceManageProcedure,
  exportDataProcedure,
  deleteRecordsProcedure,
  analyticsProcedure,
} from "./rbac-middleware";
import { uploadLeadPhoto } from './photo-storage';
import { extractLeadDataFromImage } from './ocr-service';
import { convertPdfAllPages, getPdfPageCount } from './pdf-multipage';
import { uploadLeadDocument } from "./document-storage";
import { generateEstimatePDF, generateInvoicePDF } from "./pdf-generator";

import { conversionRouter } from "./conversion-router";
import { routesRouter } from "./routers/routes";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  notifications: notificationRouter,
  inspections: inspectionRouter,
  customers: customersRouter,
  messaging: messagingRouter,
  hailRecon: hailReconRouter,
  calendar: calendarRouter,
  spreadsheet: spreadsheetRouter,
  analytics: analyticsRouter,
  rbac: rbacRouter,
  loaners: loanerRouter,
  technicians: technicianRouter,
  conversion: conversionRouter,
  routes: routesRouter,
  photos: router({
    getByLeadId: publicProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPhotosByLeadId(input.leadId);
      }),
    
    upload: publicProcedure
      .input(z.object({
        leadId: z.number(),
        photoData: z.string(), // base64 encoded image
        filename: z.string(),
        caption: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Upload to S3
        const { url } = await uploadLeadPhoto(
          input.photoData,
          input.leadId,
          input.filename
        );
        
        // Save to database
        return await db.createLeadPhoto({
          leadId: input.leadId,
          photoUrl: url,
          thumbnailUrl: url, // Using same URL for now
          caption: input.caption,
        });
      }),
    
    delete: deleteRecordsProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteLeadPhoto(input.id);
        return { success: true };
      }),
  }),
  documents: router({
    getByLeadId: publicProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDocumentsByLeadId(input.leadId);
      }),
    
    upload: publicProcedure
      .input(z.object({
        leadId: z.number(),
        fileData: z.string(), // base64 encoded file
        filename: z.string(),
        fileType: z.string(),
        category: z.enum(["insurance", "estimate", "invoice", "receipt", "authorization", "other"]).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Upload to S3
        const fileSize = Buffer.from(input.fileData.replace(/^data:[^;]+;base64,/, ""), "base64").length;
        const { url } = await uploadLeadDocument(
          input.fileData,
          input.leadId,
          input.filename,
          input.fileType
        );
        
        // Save to database
        return await db.createLeadDocument({
          leadId: input.leadId,
          documentUrl: url,
          filename: input.filename,
          fileType: input.fileType,
          fileSize,
          category: input.category,
          description: input.description,
          uploadedBy: ctx.user?.name || "Unknown",
        });
      }),
    
    delete: deleteRecordsProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteLeadDocument(input.id);
        return { success: true };
      }),
  }),
  estimates: router({
    create: financialEditProcedure
      .input(z.object({
        leadId: z.number(),
        status: z.enum(["draft", "sent"]),
        subtotal: z.number(),
        taxRate: z.number(),
        taxAmount: z.number(),
        discountAmount: z.number(),
        total: z.number(),
        notes: z.string().optional(),
        validUntil: z.date(),
        lineItems: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          total: z.number(),
          category: z.enum(["labor", "parts", "materials", "other"]),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const { lineItems, ...estimateData } = input;
        return await db.createEstimate(
          {
            ...estimateData,
            createdBy: ctx.user?.name || "Unknown",
          },
          lineItems
        );
      }),
    
    getByLeadId: financialViewProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEstimatesByLeadId(input.leadId);
      }),
    
    getById: financialViewProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getEstimateById(input.id);
      }),
    
    updateStatus: financialEditProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["draft", "sent", "approved", "rejected"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateEstimateStatus(input.id, input.status);
        return { success: true };
      }),
    
    delete: deleteRecordsProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteEstimate(input.id);
        return { success: true };
      }),
    
    convertToInvoice: invoiceManageProcedure
      .input(z.object({
        estimateId: z.number(),
        dueDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.convertEstimateToInvoice(input.estimateId, input.dueDate);
      }),
    
    generatePDF: financialViewProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const estimate = await db.getEstimateById(input.id);
        if (!estimate) throw new Error("Estimate not found");
        
        const lead = await db.getLeadById(estimate.leadId);
        if (!lead) throw new Error("Lead not found");
        
        const pdfBuffer = await generateEstimatePDF({
          estimateNumber: estimate.estimateNumber,
          date: estimate.createdAt,
          validUntil: estimate.validUntil || undefined,
          customerName: lead.name,
          customerEmail: lead.email || undefined,
          customerPhone: lead.phone || undefined,
          customerAddress: lead.address || undefined,
          lineItems: estimate.lineItems,
          subtotal: estimate.subtotal,
          taxRate: estimate.taxRate,
          taxAmount: estimate.taxAmount,
          discountAmount: estimate.discountAmount,
          total: estimate.total,
          notes: estimate.notes || undefined,
          status: estimate.status,
        });
        
        return {
          pdf: pdfBuffer.toString('base64'),
          filename: `${estimate.estimateNumber}.pdf`,
        };
      }),
  }),
  invoices: router({
    create: invoiceManageProcedure
      .input(z.object({
        leadId: z.number(),
        estimateId: z.number().optional(),
        status: z.enum(["draft", "sent"]),
        subtotal: z.number(),
        taxRate: z.number(),
        taxAmount: z.number(),
        discountAmount: z.number(),
        total: z.number(),
        amountPaid: z.number().default(0),
        amountDue: z.number(),
        dueDate: z.date().optional(),
        notes: z.string().optional(),
        lineItems: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          total: z.number(),
          category: z.enum(["labor", "parts", "materials", "other"]),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const { lineItems, ...invoiceData } = input;
        return await db.createInvoice(
          {
            ...invoiceData,
            createdBy: ctx.user?.name || "Unknown",
          },
          lineItems
        );
      }),
    
    getByLeadId: financialViewProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return await db.getInvoicesByLeadId(input.leadId);
      }),
    
    getById: financialViewProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getInvoiceById(input.id);
      }),
    
    recordPayment: paymentApproveProcedure
      .input(z.object({
        id: z.number(),
        amount: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.updateInvoicePayment(input.id, input.amount);
        return { success: true };
      }),
    
    generatePDF: financialViewProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const invoice = await db.getInvoiceById(input.id);
        if (!invoice) throw new Error("Invoice not found");
        
        const lead = await db.getLeadById(invoice.leadId);
        if (!lead) throw new Error("Lead not found");
        
        const pdfBuffer = await generateInvoicePDF({
          invoiceNumber: invoice.invoiceNumber,
          estimateNumber: "", // Not needed for invoice
          date: invoice.createdAt,
          dueDate: invoice.dueDate || undefined,
          paidDate: invoice.paidDate || undefined,
          customerName: lead.name,
          customerEmail: lead.email || undefined,
          customerPhone: lead.phone || undefined,
          customerAddress: lead.address || undefined,
          lineItems: invoice.lineItems,
          subtotal: invoice.subtotal,
          taxRate: invoice.taxRate,
          taxAmount: invoice.taxAmount,
          discountAmount: invoice.discountAmount,
          total: invoice.total,
          amountPaid: invoice.amountPaid,
          amountDue: invoice.amountDue,
          notes: invoice.notes || undefined,
          status: invoice.status,
        });
        
        return {
          pdf: pdfBuffer.toString('base64'),
          filename: `${invoice.invoiceNumber}.pdf`,
        };
      }),
  }),
  tags: router({
    list: publicProcedure.query(async () => {
      return await db.getAllTags();
    }),
    
    create: publicProcedure
      .input(z.object({
        name: z.string().min(1).max(50),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      }))
      .mutation(async ({ input }) => {
        return await db.createTag(input);
      }),
    
    delete: deleteRecordsProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTag(input.id);
        return { success: true };
      }),
    
    addToLead: publicProcedure
      .input(z.object({
        leadId: z.number(),
        tagId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.addTagToLead(input.leadId, input.tagId);
      }),
    
    removeFromLead: publicProcedure
      .input(z.object({
        leadId: z.number(),
        tagId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.removeTagFromLead(input.leadId, input.tagId);
        return { success: true };
      }),
    
    getLeadTags: publicProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return await db.getLeadTags(input.leadId);
      }),
  }),
  bulk: router({
    updateStatus: publicProcedure
      .input(z.object({
        leadIds: z.array(z.number()),
        status: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.bulkUpdateLeadStatus(input.leadIds, input.status);
        return { success: true };
      }),
    
    addTag: publicProcedure
      .input(z.object({
        leadIds: z.array(z.number()),
        tagId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.bulkAddTagToLeads(input.leadIds, input.tagId);
        return { success: true };
      }),
    
    removeTag: publicProcedure
      .input(z.object({
        leadIds: z.array(z.number()),
        tagId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.bulkRemoveTagFromLeads(input.leadIds, input.tagId);
        return { success: true };
      }),
  }),
  ocr: router({
    extractLeadData: publicProcedure
      .input(z.object({
        image: z.string(), // base64 encoded image
      }))
      .mutation(async ({ input }) => {
        return await extractLeadDataFromImage(input.image);
      }),
    extractMultiPagePdf: publicProcedure
      .input(z.object({
        pdf: z.string(), // base64 encoded PDF
      }))
      .mutation(async ({ input }) => {
        // Convert all pages to images
        const pages = await convertPdfAllPages(input.pdf);
        
        // Extract data from each page
        const results = [];
        for (const page of pages) {
          try {
            const data = await extractLeadDataFromImage(page.imageBase64);
            results.push({
              pageNumber: page.pageNumber,
              data,
              success: true,
              error: null
            });
          } catch (error: any) {
            results.push({
              pageNumber: page.pageNumber,
              data: null,
              success: false,
              error: error.message
            });
          }
        }
        
        return results;
      }),
    getPdfPageCount: publicProcedure
      .input(z.object({
        pdf: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await getPdfPageCount(input.pdf);
      }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Lead Management
  leads: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllLeads();
    }),
    
    list: publicProcedure.query(async () => {
      return await db.getAllLeads();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getLeadById(input.id);
      }),
    
    create: publicProcedure
      .input(z.object({
        address: z.string(),
        name: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        agentId: z.number().optional(),
        agentName: z.string().optional(),
        agentPhone: z.string().optional(),
        agentEmail: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.createLead(input);
        
        // Send notification to assigned agent
        if (input.agentId && input.agentName) {
          const leadId = Number((result as any).insertId);
          try {
            const { notifyNewLead } = await import("./notifications");
            await notifyNewLead(
              input.agentId,
              input.agentName,
              input.agentPhone,
              input.agentEmail,
              leadId,
              input.address
            );
          } catch (error) {
            console.error("Failed to send new lead notification:", error);
          }
        }
        
        return result;
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          latitude: z.string().optional(),
          longitude: z.string().optional(),
          status: z.enum(["lead", "scheduled", "in_shop", "awaiting_pickup", "complete"]).optional(),
          subStatus: z.string().optional(),
          lastFollowUpAt: z.string().optional(),
          followUpResult: z.enum(["no_answer", "not_interested", "interested", "scheduled"]).optional(),
          agentId: z.number().optional(),
          agentName: z.string().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        const data: any = { ...input.data };
        if (data.lastFollowUpAt) {
          data.lastFollowUpAt = new Date(data.lastFollowUpAt);
        }
        await db.updateLead(input.id, data);
        return { success: true };
      }),
    
    updateStatus: publicProcedure
      .input(z.object({
        leadId: z.number().optional(),
        id: z.number().optional(),
        status: z.enum(["lead", "scheduled", "in_shop", "awaiting_pickup", "complete"]),
      }))
      .mutation(async ({ input }) => {
        const leadId = input.leadId || input.id;
        if (!leadId) throw new Error("leadId is required");
        await db.updateLeadStatus(leadId, input.status);
        
        // Send notification for status change
        try {
          const lead = await db.getLeadById(leadId);
          if (lead && lead.agentId && lead.agentName) {
            const { notifyStatusChange } = await import("./notifications");
            await notifyStatusChange(
              lead.agentId,
              lead.agentName,
              lead.phone || undefined,
              lead.email || undefined,
              lead.id!,
              lead.address,
              lead.name || "Lead",
              input.status
            );
          }
        } catch (error) {
          console.error("Failed to send status change notification:", error);
        }
        
        return { success: true };
      }),
    
    delete: deleteRecordsProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteLead(input.id);
        return { success: true };
      }),
  }),

  // Vehicle Management
  vehicles: router({
    getByLeadId: publicProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return await db.getVehiclesByLeadId(input.leadId);
      }),
    
    create: publicProcedure
      .input(z.object({
        leadId: z.number(),
        year: z.string().optional(),
        make: z.string().optional(),
        model: z.string().optional(),
        color: z.string().optional(),
        vin: z.string().optional(),
        glassDamage: z.enum(["yes", "no"]).optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createVehicle(input);
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          year: z.string().optional(),
          make: z.string().optional(),
          model: z.string().optional(),
          color: z.string().optional(),
          vin: z.string().optional(),
          glassDamage: z.enum(["yes", "no"]).optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updateVehicle(input.id, input.data);
        return { success: true };
      }),
  }),

  // Insurance Info Management (now per vehicle)
  insurance: router({
    getByVehicleId: publicProcedure
      .input(z.object({ vehicleId: z.number() }))
      .query(async ({ input }) => {
        return await db.getVehicleInsurance(input.vehicleId);
      }),
    
    // Legacy support - get insurance for first vehicle of a lead
    getByLeadId: publicProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        const vehicles = await db.getVehiclesByLeadId(input.leadId);
        if (vehicles.length === 0) return null;
        return await db.getVehicleInsurance(vehicles[0].id);
      }),
    
    create: publicProcedure
      .input(z.object({
        vehicleId: z.number(),
        provider: z.string().optional(),
        providerPhone: z.string().optional(),
        claimNumber: z.string().optional(),
        policyNumber: z.string().optional(),
        adjusterName: z.string().optional(),
        adjusterPhone: z.string().optional(),
        adjusterEmail: z.string().optional(),
        adjusterOfficeHours: z.string().optional(),
        rentalCompany: z.string().optional(),
        rentalConfirmation: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createVehicleInsurance(input);
      }),
    
    upsert: publicProcedure
      .input(z.object({
        vehicleId: z.number(),
        provider: z.string().optional(),
        providerPhone: z.string().optional(),
        claimNumber: z.string().optional(),
        policyNumber: z.string().optional(),
        adjusterName: z.string().optional(),
        adjusterPhone: z.string().optional(),
        adjusterEmail: z.string().optional(),
        adjusterOfficeHours: z.string().optional(),
        rentalCompany: z.string().optional(),
        rentalConfirmation: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.upsertVehicleInsurance(input.vehicleId, input);
        return { success: true };
      }),
    
    update: publicProcedure
      .input(z.object({
        vehicleId: z.number(),
        data: z.object({
          provider: z.string().optional(),
          providerPhone: z.string().optional(),
          claimNumber: z.string().optional(),
          policyNumber: z.string().optional(),
          adjusterName: z.string().optional(),
          adjusterPhone: z.string().optional(),
          adjusterEmail: z.string().optional(),
          adjusterOfficeHours: z.string().optional(),
          rentalCompany: z.string().optional(),
          rentalConfirmation: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updateVehicleInsurance(input.vehicleId, input.data);
        return { success: true };
      }),
  }),

  // Follow-up Management
  followUps: router({
    getByLeadId: publicProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return await db.getFollowUpsByLeadId(input.leadId);
      }),
    
    create: publicProcedure
      .input(z.object({
        leadId: z.number(),
        agentId: z.number(),
        agentName: z.string(),
        stage: z.enum(["lead", "scheduled", "in_shop", "awaiting_pickup", "complete", "referral"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createFollowUp(input);
      }),
  }),

  // Text Templates
  textTemplates: router({
    list: publicProcedure.query(async () => {
      return await db.getAllTextTemplates();
    }),
    
    getByStage: publicProcedure
      .input(z.object({ 
        stage: z.enum(["lead", "scheduled", "in_shop", "awaiting_pickup", "complete", "referral"]) 
      }))
      .query(async ({ input }) => {
        return await db.getTextTemplateByStage(input.stage);
      }),
    
    create: publicProcedure
      .input(z.object({
        stage: z.enum(["lead", "scheduled", "in_shop", "awaiting_pickup", "complete", "referral"]),
        template: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.createTextTemplate(input);
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        template: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.updateTextTemplate(input.id, input.template);
        return { success: true };
      }),
  }),

});

export type AppRouter = typeof appRouter;
