import { Router } from "express";
import { db } from "@workspace/db";
import { studentsTable, classesTable, marksTable, attendanceTable, disciplineTable } from "@workspace/db";
import { eq, avg } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/rankings/students", async (req, res) => {
  try {
    const { classId, limit } = req.query;
    const students = classId
      ? await db.select().from(studentsTable).where(eq(studentsTable.classId, parseInt(classId as string)))
      : await db.select().from(studentsTable);

    const [allMarks, allAttendance, allDiscipline] = await Promise.all([
      db.select().from(marksTable),
      db.select().from(attendanceTable),
      db.select().from(disciplineTable),
    ]);

    const ranked = students.map(s => {
      const sMarks = allMarks.filter(m => m.studentId === s.id);
      const sAttendance = allAttendance.filter(a => a.studentId === s.id);
      const sDiscipline = allDiscipline.filter(d => d.studentId === s.id);

      const academicScore = sMarks.length
        ? Math.min(100, sMarks.reduce((sum, m) => sum + (parseFloat(m.score) / parseFloat(m.maxScore)) * 100, 0) / sMarks.length)
        : parseFloat(s.performanceScore ?? "60");

      const attScore = sAttendance.length
        ? Math.min(100, (sAttendance.filter(a => a.status === "present").length / sAttendance.length) * 100)
        : 80;

      const negDisc = sDiscipline.filter(d => d.type !== "commendation").length;
      const commendations = sDiscipline.filter(d => d.type === "commendation").length;
      const disciplineScore = Math.min(100, Math.max(0, 80 - negDisc * 10 + commendations * 5));

      // Weighted: academic 40%, discipline 20%, attendance 15%, participation 10%, leadership 10%, community 5%
      const overallScore = Math.round(academicScore * 0.40 + disciplineScore * 0.20 + attScore * 0.15 + 70 * 0.10 + 70 * 0.10 + 70 * 0.05);

      return {
        studentId: s.id, name: s.name, className: null as string | null,
        photoUrl: s.photoUrl,
        overallScore, academicScore: Math.round(academicScore), disciplineScore: Math.round(disciplineScore),
        attendanceScore: Math.round(attScore), rank: 0, classRank: null as number | null,
        trend: "stable" as const,
      };
    });

    ranked.sort((a, b) => b.overallScore - a.overallScore);
    ranked.forEach((r, i) => { r.rank = i + 1; });

    const lim = limit ? parseInt(limit as string) : ranked.length;
    res.json(ranked.slice(0, lim));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/rankings/classes", async (req, res) => {
  try {
    const classes = await db.select().from(classesTable);
    const [allMarks, allStudents, allAttendance] = await Promise.all([
      db.select().from(marksTable),
      db.select().from(studentsTable),
      db.select().from(attendanceTable),
    ]);

    const ranked = await Promise.all(classes.map(async cls => {
      const classStudents = allStudents.filter(s => s.classId === cls.id);
      const studentIds = classStudents.map(s => s.id);
      const classMarks = allMarks.filter(m => studentIds.includes(m.studentId));
      const classAttendance = allAttendance.filter(a => a.classId === cls.id || studentIds.includes(a.studentId));

      const avgScore = classMarks.length
        ? classMarks.reduce((s, m) => s + (parseFloat(m.score) / parseFloat(m.maxScore)) * 100, 0) / classMarks.length
        : 60;
      const attRate = classAttendance.length
        ? classAttendance.filter(a => a.status === "present").length / classAttendance.length * 100
        : 75;

      return {
        classId: cls.id, className: cls.name,
        averageScore: Math.round(avgScore * 10) / 10,
        attendanceRate: Math.round(attRate * 10) / 10,
        studentCount: classStudents.length,
        rank: 0, teacherName: null as string | null,
      };
    }));

    ranked.sort((a, b) => b.averageScore - a.averageScore);
    ranked.forEach((r, i) => { r.rank = i + 1; });
    res.json(ranked);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
