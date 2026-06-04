import { Router } from "express";
import { db } from "@workspace/db";
import { disciplineTable, studentsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/discipline", requireAuth, async (req, res) => {
  try {
    const { studentId } = req.query;
    const records = studentId
      ? await db.select().from(disciplineTable).where(eq(disciplineTable.studentId, parseInt(studentId as string)))
      : await db.select().from(disciplineTable);
    const studentIds = [...new Set(records.map(r => r.studentId))];
    const students = await Promise.all(studentIds.map(id =>
      db.select({ id: studentsTable.id, name: studentsTable.name }).from(studentsTable).where(eq(studentsTable.id, id)).then(r => r[0])
    ));
    const sMap = Object.fromEntries(students.filter(Boolean).map(s => [s!.id, s!.name]));
    res.json(records.map(r => ({ ...r, studentName: sMap[r.studentId] ?? null, createdAt: r.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/discipline", requireAuth, async (req, res) => {
  try {
    const { studentId, type, description, date, severity } = req.body;
    const user = (req as any).user;
    const [record] = await db.insert(disciplineTable).values({
      studentId, type, description, date, severity,
      issuedBy: user?.name ?? null, resolved: false,
    }).returning();
    const [student] = await db.select({ name: studentsTable.name }).from(studentsTable).where(eq(studentsTable.id, studentId));
    res.status(201).json({ ...record, studentName: student?.name ?? null, createdAt: record.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/discipline/:id", requireAuth, async (req, res) => {
  try {
    const updates: any = {};
    if (req.body.resolved !== undefined) updates.resolved = req.body.resolved;
    if (req.body.description !== undefined) updates.description = req.body.description;
    const [updated] = await db.update(disciplineTable).set(updates).where(eq(disciplineTable.id, parseInt(req.params.id))).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    const [student] = await db.select({ name: studentsTable.name }).from(studentsTable).where(eq(studentsTable.id, updated.studentId));
    res.json({ ...updated, studentName: student?.name ?? null, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
