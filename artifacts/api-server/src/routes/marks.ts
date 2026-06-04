import { Router } from "express";
import { db } from "@workspace/db";
import { marksTable, studentsTable, teachersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

function calcGrade(pct: number) {
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

async function enrichMark(m: any) {
  const [student] = await db.select({ name: studentsTable.name }).from(studentsTable).where(eq(studentsTable.id, m.studentId));
  const teacher = m.teacherId
    ? (await db.select({ name: teachersTable.name }).from(teachersTable).where(eq(teachersTable.id, m.teacherId)))[0]
    : null;
  const score = parseFloat(m.score);
  const maxScore = parseFloat(m.maxScore);
  const pct = (score / maxScore) * 100;
  return {
    ...m, score, maxScore,
    percentage: Math.round(pct * 10) / 10,
    grade: calcGrade(pct),
    studentName: student?.name ?? null,
    teacherName: teacher?.name ?? null,
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/marks", requireAuth, async (req, res) => {
  try {
    const { studentId, classId, term } = req.query;
    let query = db.select().from(marksTable);
    const conditions: any[] = [];
    if (studentId) conditions.push(eq(marksTable.studentId, parseInt(studentId as string)));
    if (term) conditions.push(eq(marksTable.term, term as string));
    if (classId) {
      const classStudents = await db.select({ id: studentsTable.id }).from(studentsTable).where(eq(studentsTable.classId, parseInt(classId as string)));
      const ids = classStudents.map(s => s.id);
      if (ids.length === 0) { res.json([]); return; }
    }
    const marks = conditions.length
      ? await db.select().from(marksTable).where(and(...conditions))
      : await db.select().from(marksTable);
    const enriched = await Promise.all(marks.map(enrichMark));
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/marks", requireAuth, async (req, res) => {
  try {
    const { studentId, subject, score, maxScore, term, teacherId, remarks } = req.body;
    const [mark] = await db.insert(marksTable).values({
      studentId, subject, score: String(score), maxScore: String(maxScore),
      term, teacherId: teacherId ?? null, remarks: remarks ?? null,
    }).returning();
    res.status(201).json(await enrichMark(mark));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/marks/:id", requireAuth, async (req, res) => {
  try {
    const updates: any = {};
    if (req.body.score !== undefined) updates.score = String(req.body.score);
    if (req.body.maxScore !== undefined) updates.maxScore = String(req.body.maxScore);
    if (req.body.remarks !== undefined) updates.remarks = req.body.remarks;
    const [updated] = await db.update(marksTable).set(updates).where(eq(marksTable.id, parseInt(req.params.id))).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await enrichMark(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/marks/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(marksTable).where(eq(marksTable.id, parseInt(req.params.id)));
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
