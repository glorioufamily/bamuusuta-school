import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const schoolBrandingTable = pgTable("school_branding", {
  id: serial("id").primaryKey(),
  schoolName: text("school_name").notNull().default("Greenfield Academy"),
  motto: text("motto").default("Nurturing Tomorrow's Leaders Today"),
  logoUrl: text("logo_url"),
  contactInfo: text("contact_info"),
  address: text("address"),
  email: text("email"),
  website: text("website"),
  welcomeMessage: text("welcome_message"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSchoolBrandingSchema = createInsertSchema(schoolBrandingTable).omit({ id: true, updatedAt: true });
export type InsertSchoolBranding = z.infer<typeof insertSchoolBrandingSchema>;
export type SchoolBranding = typeof schoolBrandingTable.$inferSelect;
