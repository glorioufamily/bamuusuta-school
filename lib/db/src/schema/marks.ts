import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const marksTable = pgTable("marks", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  subject: text("subject").notNull(),
  score: numeric("score").notNull(),
  maxScore: numeric("max_score").notNull(),
  term: text("term").notNull(),
  teacherId: integer("teacher_id"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMarkSchema = createInsertSchema(marksTable).omit({ id: true, createdAt: true });
export type InsertMark = z.infer<typeof insertMarkSchema>;
export type Mark = typeof marksTable.$inferSelect;
