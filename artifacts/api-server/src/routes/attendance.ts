import { Router } from "express";
import { db } from "@workspace/db";
import { attendanceTable, studentsTable, classesTable } from "@workspace/db";
import { eq, and, count, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/attendance", requireAuth, async (req, res) => {
  try {
    const { studentId, classId, date } = req.query;
    const conditions: any[] = [];
    if (studentId) conditions.push(eq(attendanceTable.studentId, parseInt(studentId as string)));
    if (date) conditions.push(eq(attendanceTable.date, date as string));
    if (classId) conditions.push(eq(attendanceTable.classId, parseInt(classId as string)));
    const records = conditions.length
      ? await db.select().from(attendanceTable).where(and(...conditions))
      : await db.select().from(attendanceTable);
    const studentIds = [...new Set(records.map(r => r.studentId))];
    const students = studentIds.length
      ? await Promise.all(studentIds.map(id => db.select({ id: studentsTable.id, name: studentsTable.name }).from(studentsTable).where(eq(studentsTable.id, id)).then(r => r[0])))
      : [];
    const studentMap = Object.fromEntries(students.filter(Boolean).map(s => [s!.id, s!.name]));
    const enriched = records.map(r => ({
      ...r, studentName: studentMap[r.studentId] ?? null, createdAt: r.createdAt.toISOString(),
    }));
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/attendance", requireAuth, async (req, res) => {
  try {
    const { studentId, classId, date, status, reason } = req.body;
    const [record] = await db.insert(attendanceTable).values({
      studentId, classId: classId ?? null, date, status, reason: reason ?? null,
    }).returning();
    const [student] = await db.select({ name: studentsTable.name }).from(studentsTable).where(eq(studentsTable.id, studentId));
    res.status(201).json({ ...record, studentName: student?.name ?? null, createdAt: record.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/attendance/summary", requireAuth, async (req, res) => {
  try {
    const all = await db.select().from(attendanceTable);
    const total = all.length || 1;
    const presentCount = all.filter(a => a.status === "present").length;
    const absentCount = all.filter(a => a.status === "absent").length;
    const lateCount = all.filter(a => a.status === "late").length;
    const classes = await db.select().from(classesTable);
    const byClass = await Promise.all(classes.map(async cls => {
      const clsRecords = all.filter(a => a.classId === cls.id);
      const clsTotal = clsRecords.length || 1;
      const clsPresent = clsRecords.filter(a => a.status === "present").length;
      return {
        classId: cls.id,
        className: cls.name,
        presentRate: Math.round((clsPresent / clsTotal) * 100 * 10) / 10,
      };
    }));
    res.json({
      totalDays: total,
      presentRate: Math.round((presentCount / total) * 100 * 10) / 10,
      absentRate: Math.round((absentCount / total) * 100 * 10) / 10,
      lateRate: Math.round((lateCount / total) * 100 * 10) / 10,
      byClass,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
