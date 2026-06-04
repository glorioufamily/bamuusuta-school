import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  classId: integer("class_id"),
  gender: text("gender").notNull(), // male, female, other
  photoUrl: text("photo_url"),
  parentContact: text("parent_contact"),
  performanceScore: numeric("performance_score"),
  riskScore: numeric("risk_score"),
  riskLevel: text("risk_level"), // low, medium, high
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
