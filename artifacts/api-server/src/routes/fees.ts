import { Router } from "express";
import { db } from "@workspace/db";
import { feesTable, studentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

function enrichFee(f: any, studentName: string | null = null) {
  const total = parseFloat(f.totalAmount);
  const paid = parseFloat(f.amountPaid);
  const balance = total - paid;
  const status = paid >= total ? "paid" : paid > 0 ? "partial" : "unpaid";
  return {
    ...f, totalAmount: total, amountPaid: paid, balance, status,
    studentName, createdAt: f.createdAt.toISOString(),
  };
}

router.get("/fees", requireAuth, async (req, res) => {
  try {
    const { studentId, term } = req.query;
    const conditions: any[] = [];
    if (studentId) conditions.push(eq(feesTable.studentId, parseInt(studentId as string)));
    if (term) conditions.push(eq(feesTable.term, term as string));
    const records = conditions.length
      ? await db.select().from(feesTable).where(and(...conditions))
      : await db.select().from(feesTable);
    const studentIds = [...new Set(records.map(r => r.studentId))];
    const students = await Promise.all(studentIds.map(id =>
      db.select({ id: studentsTable.id, name: studentsTable.name }).from(studentsTable).where(eq(studentsTable.id, id)).then(r => r[0])
    ));
    const studentMap = Object.fromEntries(students.filter(Boolean).map(s => [s!.id, s!.name]));
    res.json(records.map(r => enrichFee(r, studentMap[r.studentId] ?? null)));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/fees", requireAuth, async (req, res) => {
  try {
    const { studentId, term, totalAmount, amountPaid, notes } = req.body;
    const paid = amountPaid ?? 0;
    const status = paid >= totalAmount ? "paid" : paid > 0 ? "partial" : "unpaid";
    const [record] = await db.insert(feesTable).values({
      studentId, term,
      totalAmount: String(totalAmount),
      amountPaid: String(paid),
      status,
      notes: notes ?? null,
    }).returning();
    const [student] = await db.select({ name: studentsTable.name }).from(studentsTable).where(eq(studentsTable.id, studentId));
    res.status(201).json(enrichFee(record, student?.name ?? null));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/fees/:id", requireAuth, async (req, res) => {
  try {
    const [existing] = await db.select().from(feesTable).where(eq(feesTable.id, parseInt(req.params.id)));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const updates: any = {};
    if (req.body.amountPaid !== undefined) {
      updates.amountPaid = String(req.body.amountPaid);
      const total = parseFloat(existing.totalAmount);
      const paid = req.body.amountPaid;
      updates.status = paid >= total ? "paid" : paid > 0 ? "partial" : "unpaid";
    }
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    const [updated] = await db.update(feesTable).set(updates).where(eq(feesTable.id, parseInt(req.params.id))).returning();
    const [student] = await db.select({ name: studentsTable.name }).from(studentsTable).where(eq(studentsTable.id, updated.studentId));
    res.json(enrichFee(updated, student?.name ?? null));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/fees/report", requireAuth, async (req, res) => {
  try {
    const all = await db.select().from(feesTable);
    const totalExpected = all.reduce((s, f) => s + parseFloat(f.totalAmount), 0);
    const totalCollected = all.reduce((s, f) => s + parseFloat(f.amountPaid), 0);
    const totalOutstanding = totalExpected - totalCollected;
    const fullyPaidCount = all.filter(f => parseFloat(f.amountPaid) >= parseFloat(f.totalAmount)).length;
    const partialCount = all.filter(f => parseFloat(f.amountPaid) > 0 && parseFloat(f.amountPaid) < parseFloat(f.totalAmount)).length;
    const unpaidCount = all.filter(f => parseFloat(f.amountPaid) === 0).length;
    const terms = [...new Set(all.map(f => f.term))];
    const byTerm = terms.map(term => {
      const termFees = all.filter(f => f.term === term);
      return {
        term,
        collected: termFees.reduce((s, f) => s + parseFloat(f.amountPaid), 0),
        outstanding: termFees.reduce((s, f) => s + Math.max(0, parseFloat(f.totalAmount) - parseFloat(f.amountPaid)), 0),
      };
    });
    res.json({
      totalExpected, totalCollected, totalOutstanding,
      collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100 * 10) / 10 : 0,
      fullyPaidCount, partialCount, unpaidCount, byTerm,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
