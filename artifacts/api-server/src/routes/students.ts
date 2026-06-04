import { Router } from "express";
import { db } from "@workspace/db";
import { studentsTable, classesTable, marksTable, attendanceTable, disciplineTable, feesTable } from "@workspace/db";
import { eq, ilike, and, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

function calcGrade(pct: number) {
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

async function enrichStudent(s: any) {
  let className: string | null = null;
  if (s.classId) {
    const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, s.classId));
    className = cls?.name ?? null;
  }
  return {
    ...s,
    className,
    performanceScore: s.performanceScore !== null ? parseFloat(s.performanceScore) : null,
    riskScore: s.riskScore !== null ? parseFloat(s.riskScore) : null,
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/students", requireAuth, async (req, res) => {
  try {
    const { classId, search } = req.query;
    let conditions: any[] = [];
    if (classId) conditions.push(eq(studentsTable.classId, parseInt(classId as string)));
    if (search) conditions.push(ilike(studentsTable.name, `%${search}%`));
    const students = conditions.length
      ? await db.select().from(studentsTable).where(and(...conditions))
      : await db.select().from(studentsTable);
    const enriched = await Promise.all(students.map(enrichStudent));
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/students", requireAuth, async (req, res) => {
  try {
    const { name, dateOfBirth, classId, gender, photoUrl, parentContact } = req.body;
    const [student] = await db.insert(studentsTable).values({
      name, dateOfBirth, classId: classId ?? null,
      gender, photoUrl: photoUrl ?? null, parentContact: parentContact ?? null,
      performanceScore: "50", riskScore: "20", riskLevel: "low",
    }).returning();
    res.status(201).json(await enrichStudent(student));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/students/:id", requireAuth, async (req, res) => {
  try {
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, parseInt(req.params.id)));
    if (!student) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await enrichStudent(student));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/students/:id", requireAuth, async (req, res) => {
  try {
    const updates: any = {};
    const fields = ["name", "dateOfBirth", "classId", "gender", "photoUrl", "parentContact"];
    for (const f of fields) if (req.body[f] !== undefined) updates[f === "dateOfBirth" ? "dateOfBirth" : f === "classId" ? "classId" : f === "photoUrl" ? "photoUrl" : f === "parentContact" ? "parentContact" : f] = req.body[f];
    const [updated] = await db.update(studentsTable).set(updates).where(eq(studentsTable.id, parseInt(req.params.id))).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await enrichStudent(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/students/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(studentsTable).where(eq(studentsTable.id, parseInt(req.params.id)));
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/students/:id/profile", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, id));
    if (!student) { res.status(404).json({ error: "Not found" }); return; }

    const [marks, attendance, discipline, fees] = await Promise.all([
      db.select().from(marksTable).where(eq(marksTable.studentId, id)),
      db.select().from(attendanceTable).where(eq(attendanceTable.studentId, id)),
      db.select().from(disciplineTable).where(eq(disciplineTable.studentId, id)),
      db.select().from(feesTable).where(eq(feesTable.studentId, id)),
    ]);

    const marksEnriched = marks.map(m => {
      const pct = (parseFloat(m.score) / parseFloat(m.maxScore)) * 100;
      return {
        ...m, score: parseFloat(m.score), maxScore: parseFloat(m.maxScore),
        percentage: Math.round(pct * 10) / 10, grade: calcGrade(pct),
        studentName: student.name, teacherName: null,
        createdAt: m.createdAt.toISOString(),
      };
    });

    const attendanceEnriched = attendance.map(a => ({
      ...a, studentName: student.name, createdAt: a.createdAt.toISOString(),
    }));

    const disciplineEnriched = discipline.map(d => ({
      ...d, studentName: student.name, createdAt: d.createdAt.toISOString(),
    }));

    const feesEnriched = fees.map(f => {
      const total = parseFloat(f.totalAmount);
      const paid = parseFloat(f.amountPaid);
      const balance = total - paid;
      const status = paid >= total ? "paid" : paid > 0 ? "partial" : "unpaid";
      return {
        ...f, totalAmount: total, amountPaid: paid, balance,
        status, studentName: student.name, createdAt: f.createdAt.toISOString(),
      };
    });

    // Calculate ranking data
    const allStudents = await db.select().from(studentsTable);
    const scores = allStudents.map(s => parseFloat(s.performanceScore ?? "0"));
    scores.sort((a, b) => b - a);
    const myScore = parseFloat(student.performanceScore ?? "0");
    const rank = scores.indexOf(myScore) + 1;

    const ranking = {
      studentId: student.id,
      name: student.name,
      className: null as string | null,
      photoUrl: student.photoUrl,
      overallScore: myScore,
      academicScore: myScore,
      disciplineScore: 70,
      attendanceScore: 80,
      rank,
      classRank: null as number | null,
      trend: "stable" as const,
    };

    // Build timeline
    const timeline = [
      ...marksEnriched.map(m => ({
        id: m.id, type: "mark" as const,
        title: `Mark: ${m.subject}`,
        description: `${m.score}/${m.maxScore} (${m.grade}) — Term ${m.term}`,
        date: m.createdAt, severity: parseFloat(String(m.percentage)) >= 50 ? "positive" as const : "negative" as const,
      })),
      ...attendanceEnriched.map(a => ({
        id: a.id, type: "attendance" as const,
        title: `Attendance: ${a.status}`,
        description: `${a.date}${a.reason ? " — " + a.reason : ""}`,
        date: a.createdAt, severity: a.status === "present" ? "positive" as const : "negative" as const,
      })),
      ...disciplineEnriched.map(d => ({
        id: d.id, type: "discipline" as const,
        title: `Discipline: ${d.type}`,
        description: d.description,
        date: d.createdAt, severity: d.type === "commendation" ? "positive" as const : "negative" as const,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);

    res.json({
      student: await enrichStudent(student),
      marks: marksEnriched,
      attendance: attendanceEnriched,
      disciplineRecords: disciplineEnriched,
      fees: feesEnriched,
      ranking,
      timeline,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
