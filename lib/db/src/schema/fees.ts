import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const feesTable = pgTable("fees", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  term: text("term").notNull(),
  totalAmount: numeric("total_amount").notNull(),
  amountPaid: numeric("amount_paid").notNull().default("0"),
  status: text("status").notNull().default("unpaid"), // paid, partial, unpaid
  bursarId: integer("bursar_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFeeSchema = createInsertSchema(feesTable).omit({ id: true, createdAt: true });
export type InsertFee = z.infer<typeof insertFeeSchema>;
export type FeeRecord = typeof feesTable.$inferSelect;
