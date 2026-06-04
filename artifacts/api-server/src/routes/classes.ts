import { Router } from "express";
import { db } from "@workspace/db";
import { classesTable, teachersTable, studentsTable, marksTable } from "@workspace/db";
import { eq, avg, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

async function enrichClass(c: any) {
  const [teacher] = c.teacherId
    ? await db.select().from(teachersTable).where(eq(teachersTable.id, c.teacherId))
    : [];
  const studentCount = await db.select({ count: count() }).from(studentsTable).where(eq(studentsTable.classId, c.id));
  const avgScore = await db.select({ avg: avg(marksTable.score) }).from(marksTable)
    .innerJoin(studentsTable, eq(marksTable.studentId, studentsTable.id))
    .where(eq(studentsTable.classId, c.id));
  return {
    ...c,
    teacherName: teacher?.name ?? null,
    studentCount: parseInt(String(studentCount[0]?.count ?? 0)),
    averageScore: avgScore[0]?.avg ? Math.round(parseFloat(avgScore[0].avg) * 10) / 10 : null,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/classes", requireAuth, async (req, res) => {
  try {
    const classes = await db.select().from(classesTable);
    const enriched = await Promise.all(classes.map(enrichClass));
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/classes", requireAuth, async (req, res) => {
  try {
    const { name, year, teacherId } = req.body;
    const [cls] = await db.insert(classesTable).values({ name, year, teacherId: teacherId ?? null }).returning();
    res.status(201).json(await enrichClass(cls));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/classes/:id", requireAuth, async (req, res) => {
  try {
    const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, parseInt(req.params.id)));
    if (!cls) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await enrichClass(cls));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
