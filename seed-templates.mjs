import { drizzle } from "drizzle-orm/mysql2";
import { textTemplates } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

const defaultTemplates = [
  {
    stage: "lead",
    template: `Hi [Name], this is [Agent] from Hail Solutions Group. I noticed potential hail damage on your vehicle at [Address]. We specialize in helping homeowners file insurance claims and get their vehicles repaired at no out-of-pocket cost. Would you be interested in learning more? Reply YES to schedule a free inspection.`
  },
  {
    stage: "scheduled",
    template: `Hi [Name], this is [Agent] from Hail Solutions Group. Just confirming your appointment for [Date] at [Time] to bring your [Vehicle] to our shop for inspection. Our address is [Shop Address]. Please bring your insurance card and driver's license. See you soon!`
  },
  {
    stage: "in_shop",
    template: `Hi [Name], this is [Agent] from Hail Solutions Group. Your [Vehicle] is currently in our shop. We've completed the inspection and submitted the claim to [Insurance Provider]. We're waiting for adjuster approval and will keep you updated. Estimated completion: [Est Date].`
  },
  {
    stage: "awaiting_pickup",
    template: `Hi [Name], great news! Your [Vehicle] is ready for pickup at Hail Solutions Group. All repairs are complete and your vehicle looks great. We're open [Hours]. Please bring your ID when you come to pick up. Looking forward to seeing you!`
  },
  {
    stage: "complete",
    template: `Hi [Name], thank you for choosing Hail Solutions Group! We hope you're happy with your vehicle's repairs. If you know anyone else affected by hail damage, we'd appreciate the referral. We offer a $[Amount] referral bonus for each new customer you send our way. Thanks again!`
  },
  {
    stage: "referral",
    template: `Hi [Name], [Referrer Name] recommended we reach out to you about hail damage repair. We're Hail Solutions Group and we help file insurance claims and repair vehicles at no cost to you. Would you be interested in a free inspection? Reply YES and we'll get you scheduled.`
  }
];

async function seed() {
  console.log("Seeding text templates...");
  
  for (const template of defaultTemplates) {
    try {
      await db.insert(textTemplates).values(template).onDuplicateKeyUpdate({
        set: { template: template.template }
      });
      console.log(`✓ Seeded template for stage: ${template.stage}`);
    } catch (error) {
      console.error(`✗ Error seeding ${template.stage}:`, error.message);
    }
  }
  
  console.log("Done!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
