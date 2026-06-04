import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const disciplineTable = pgTable("discipline", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  type: text("type").notNull(), // warning, suspension, commendation, detention, expulsion
  description: text("description").notNull(),
  date: text("date").notNull(),
  issuedBy: text("issued_by"),
  severity: text("severity").notNull(), // low, medium, high
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDisciplineSchema = createInsertSchema(disciplineTable).omit({ id: true, createdAt: true });
export type InsertDiscipline = z.infer<typeof insertDisciplineSchema>;
export type DisciplineRecord = typeof disciplineTable.$inferSelect;
