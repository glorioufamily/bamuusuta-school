import { Router } from "express";
import { db } from "@workspace/db";
import {
  studentsTable,
  classesTable,
  marksTable,
  attendanceTable,
  disciplineTable,
  feesTable,
  teachersTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// Discipline investigation: all incidents with full student details
router.get("/intelligence/discipline", requireAuth, async (req, res) => {
  try {
    const incidents = await db.select().from(disciplineTable);
    const studentIds = [...new Set(incidents.map((d) => d.studentId))];

    const students = await Promise.all(
      studentIds.map((id) =>
        db
          .select()
          .from(studentsTable)
          .where(eq(studentsTable.id, id))
          .then((r) => r[0]),
      ),
    );
    const studentMap = Object.fromEntries(
      students.filter(Boolean).map((s) => [s!.id, s!]),
    );

    const classes = await db.select().from(classesTable);
    const classMap = Object.fromEntries(classes.map((c) => [c.id, c.name]));

    const result = incidents.map((d) => {
      const student = studentMap[d.studentId];
      return {
        ...d,
        studentName: student?.name ?? null,
        studentPhoto: student?.photoUrl ?? null,
        className: student?.classId ? classMap[student.classId] ?? null : null,
        dateOfBirth: student?.dateOfBirth ?? null,
        createdAt: d.createdAt.toISOString(),
      };
    });

    result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Class investigation: student list with performance, attendance, discipline indicators
router.get("/intelligence/class/:id", requireAuth, async (req, res) => {
  try {
    const classId = parseInt(req.params.id);
    const [cls] = await db
      .select()
      .from(classesTable)
      .where(eq(classesTable.id, classId));
    if (!cls) {
      res.status(404).json({ error: "Class not found" });
      return;
    }

    const teacher = cls.teacherId
      ? (
          await db
            .select()
            .from(teachersTable)
            .where(eq(teachersTable.id, cls.teacherId))
        )[0]
      : null;

    const students = await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.classId, classId));

    const [allMarks, allAttendance, allDiscipline, allFees] = await Promise.all(
      [
        db.select().from(marksTable),
        db.select().from(attendanceTable),
        db.select().from(disciplineTable),
        db.select().from(feesTable),
      ],
    );

    const enriched = students.map((s) => {
      const sMarks = allMarks.filter((m) => m.studentId === s.id);
      const sAttendance = allAttendance.filter((a) => a.studentId === s.id);
      const sDiscipline = allDiscipline.filter((d) => d.studentId === s.id);
      const sFees = allFees.filter((f) => f.studentId === s.id);

      const avgMark =
        sMarks.length > 0
          ? sMarks.reduce(
              (sum, m) =>
                sum + (parseFloat(m.score) / parseFloat(m.maxScore)) * 100,
              0,
            ) / sMarks.length
          : null;

      const presentCount = sAttendance.filter(
        (a) => a.status === "present",
      ).length;
      const attendanceRate =
        sAttendance.length > 0
          ? Math.round((presentCount / sAttendance.length) * 100 * 10) / 10
          : null;

      const negDiscipline = sDiscipline.filter(
        (d) => d.type !== "commendation",
      ).length;
      const openIncidents = sDiscipline.filter(
        (d) => d.type !== "commendation" && !d.resolved,
      ).length;

      const totalFees = sFees.reduce(
        (s, f) => s + parseFloat(f.totalAmount),
        0,
      );
      const paidFees = sFees.reduce(
        (s, f) => s + parseFloat(f.amountPaid),
        0,
      );
      const feesBalance = totalFees - paidFees;

      const recentDiscipline = sDiscipline
        .filter((d) => d.type !== "commendation")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 2)
        .map((d) => ({
          id: d.id,
          type: d.type,
          severity: d.severity,
          description: d.description,
          date: d.date,
          resolved: d.resolved,
        }));

      const recentMarks = sMarks
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 3)
        .map((m) => ({
          subject: m.subject,
          score: parseFloat(m.score),
          maxScore: parseFloat(m.maxScore),
          percentage: Math.round(
            (parseFloat(m.score) / parseFloat(m.maxScore)) * 100 * 10,
          ) / 10,
          term: m.term,
          remarks: m.remarks,
          teacherName: null as string | null,
        }));

      return {
        id: s.id,
        name: s.name,
        photoUrl: s.photoUrl,
        gender: s.gender,
        riskLevel: s.riskLevel,
        riskScore: s.riskScore ? parseFloat(s.riskScore) : 0,
        performanceScore: s.performanceScore
          ? parseFloat(s.performanceScore)
          : 0,
        avgMarkPercentage: avgMark !== null ? Math.round(avgMark * 10) / 10 : null,
        attendanceRate,
        totalDisciplineIncidents: negDiscipline,
        openDisciplineIncidents: openIncidents,
        feesBalance,
        feesStatus:
          feesBalance <= 0
            ? "paid"
            : paidFees > 0
              ? "partial"
              : "unpaid",
        recentDiscipline,
        recentMarks,
        marksCount: sMarks.length,
        attendanceCount: sAttendance.length,
      };
    });

    enriched.sort((a, b) => (b.performanceScore ?? 0) - (a.performanceScore ?? 0));

    res.json({
      class: {
        id: cls.id,
        name: cls.name,
        year: cls.year,
        teacherName: teacher?.name ?? null,
        teacherSubject: teacher?.subject ?? null,
        studentCount: students.length,
      },
      students: enriched,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Root cause analysis for a specific student
router.get("/intelligence/root-cause/:studentId", requireAuth, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const [student] = await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.id, studentId));
    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    const [marks, attendance, discipline, fees] = await Promise.all([
      db.select().from(marksTable).where(eq(marksTable.studentId, studentId)),
      db
        .select()
        .from(attendanceTable)
        .where(eq(attendanceTable.studentId, studentId)),
      db
        .select()
        .from(disciplineTable)
        .where(eq(disciplineTable.studentId, studentId)),
      db.select().from(feesTable).where(eq(feesTable.studentId, studentId)),
    ]);

    // Academic strength/weakness analysis
    const subjectGroups: Record<string, number[]> = {};
    for (const m of marks) {
      if (!subjectGroups[m.subject]) subjectGroups[m.subject] = [];
      subjectGroups[m.subject].push(
        (parseFloat(m.score) / parseFloat(m.maxScore)) * 100,
      );
    }
    const subjectAverages = Object.entries(subjectGroups).map(
      ([subject, scores]) => ({
        subject,
        average: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
        count: scores.length,
      }),
    );
    subjectAverages.sort((a, b) => b.average - a.average);
    const strengths = subjectAverages.filter((s) => s.average >= 70);
    const weaknesses = subjectAverages.filter((s) => s.average < 60);

    // Term-by-term trend
    const termGroups: Record<string, number[]> = {};
    for (const m of marks) {
      if (!termGroups[m.term]) termGroups[m.term] = [];
      termGroups[m.term].push(
        (parseFloat(m.score) / parseFloat(m.maxScore)) * 100,
      );
    }
    const termTrend = Object.entries(termGroups)
      .map(([term, scores]) => ({
        term,
        average: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      }))
      .sort((a, b) => a.term.localeCompare(b.term));

    // Performance drop detection
    let performanceDrop = false;
    let dropDescription = "";
    if (termTrend.length >= 2) {
      const last = termTrend[termTrend.length - 1].average;
      const prev = termTrend[termTrend.length - 2].average;
      if (prev - last >= 10) {
        performanceDrop = true;
        dropDescription = `Score dropped from ${prev}% (${termTrend[termTrend.length - 2].term}) to ${last}% (${termTrend[termTrend.length - 1].term})`;
      }
    }

    // Attendance analysis
    const presentCount = attendance.filter((a) => a.status === "present").length;
    const absentCount = attendance.filter((a) => a.status === "absent").length;
    const lateCount = attendance.filter((a) => a.status === "late").length;
    const attendanceRate =
      attendance.length > 0
        ? Math.round((presentCount / attendance.length) * 100 * 10) / 10
        : 100;
    const attendanceConcern = attendanceRate < 80;

    // Discipline analysis
    const negIncidents = discipline.filter((d) => d.type !== "commendation");
    const highSeverity = negIncidents.filter((d) => d.severity === "high");
    const disciplineConcern = negIncidents.length >= 2 || highSeverity.length >= 1;
    const commendations = discipline.filter((d) => d.type === "commendation");

    // Financial stress
    const totalFees = fees.reduce((s, f) => s + parseFloat(f.totalAmount), 0);
    const paidFees = fees.reduce((s, f) => s + parseFloat(f.amountPaid), 0);
    const feesBalance = totalFees - paidFees;
    const financialStress = feesBalance > totalFees * 0.3;

    // Teacher remarks aggregation
    const remarksWithContext = marks
      .filter((m) => m.remarks)
      .map((m) => ({
        subject: m.subject,
        term: m.term,
        remark: m.remarks!,
        score: parseFloat(m.score),
        maxScore: parseFloat(m.maxScore),
        percentage: Math.round(
          (parseFloat(m.score) / parseFloat(m.maxScore)) * 100 * 10,
        ) / 10,
        teacherName: m.teacherId ? null : null,
      }));

    // Root cause factors
    const factors: Array<{ factor: string; severity: "high" | "medium" | "low"; description: string; recommendation: string }> = [];

    if (attendanceConcern) {
      factors.push({
        factor: "Poor Attendance",
        severity: attendanceRate < 65 ? "high" : "medium",
        description: `Attendance rate is ${attendanceRate}%. Student has been absent ${absentCount} days and late ${lateCount} times.`,
        recommendation: "Engage parent/guardian. Investigate underlying causes (health, transport, home situation). Consider flexible scheduling.",
      });
    }

    if (disciplineConcern) {
      factors.push({
        factor: "Discipline Issues",
        severity: highSeverity.length >= 1 ? "high" : "medium",
        description: `${negIncidents.length} discipline incident(s) recorded${highSeverity.length > 0 ? `, including ${highSeverity.length} high-severity case(s)` : ""}.`,
        recommendation: "Schedule counseling session. Engage class teacher for behavioural support plan. Consider peer mentoring.",
      });
    }

    if (financialStress) {
      factors.push({
        factor: "Financial Strain",
        severity: feesBalance > totalFees * 0.6 ? "high" : "medium",
        description: `Outstanding fees balance of GHS ${feesBalance.toFixed(2)} (${Math.round((feesBalance / totalFees) * 100)}% unpaid).`,
        recommendation: "Contact bursar for payment plan. Check eligibility for bursary or scholarship. Ensure financial stress is not causing school avoidance.",
      });
    }

    if (weaknesses.length > 0) {
      factors.push({
        factor: "Subject Weaknesses",
        severity: weaknesses.some((w) => w.average < 40) ? "high" : "medium",
        description: `Struggling in: ${weaknesses.map((w) => `${w.subject} (${w.average}%)`).join(", ")}.`,
        recommendation: "Arrange subject-specific tutoring. Review teacher feedback. Identify if gaps are foundational or recent.",
      });
    }

    if (performanceDrop) {
      factors.push({
        factor: "Recent Performance Drop",
        severity: "high",
        description: dropDescription,
        recommendation: "Investigate what changed between terms. Cross-reference with attendance and discipline records for the same period.",
      });
    }

    if (factors.length === 0 && commendations.length === 0) {
      factors.push({
        factor: "No Significant Concerns",
        severity: "low",
        description: "Student does not show any major risk factors at this time.",
        recommendation: "Continue monitoring. Encourage continued engagement.",
      });
    }

    res.json({
      studentId,
      studentName: student.name,
      riskLevel: student.riskLevel,
      riskScore: student.riskScore ? parseFloat(student.riskScore) : 0,
      performanceDrop,
      dropDescription: dropDescription || null,
      attendanceRate,
      attendanceConcern,
      absentCount,
      lateCount,
      disciplineConcern,
      negativeIncidents: negIncidents.length,
      highSeverityIncidents: highSeverity.length,
      commendations: commendations.length,
      financialStress,
      feesBalance,
      totalFees,
      strengths,
      weaknesses,
      termTrend,
      teacherRemarks: remarksWithContext,
      rootCauseFactors: factors,
      recentDiscipline: negIncidents
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map((d) => ({
          id: d.id,
          type: d.type,
          description: d.description,
          date: d.date,
          severity: d.severity,
          issuedBy: d.issuedBy,
          resolved: d.resolved,
        })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Attendance investigation: aggregate by student with concern flags
router.get("/intelligence/attendance", requireAuth, async (req, res) => {
  try {
    const students = await db.select().from(studentsTable);
    const allAttendance = await db.select().from(attendanceTable);
    const classes = await db.select().from(classesTable);
    const classMap = Object.fromEntries(classes.map((c) => [c.id, c.name]));

    const result = students.map((s) => {
      const sAtt = allAttendance.filter((a) => a.studentId === s.id);
      const presentCount = sAtt.filter((a) => a.status === "present").length;
      const absentCount = sAtt.filter((a) => a.status === "absent").length;
      const lateCount = sAtt.filter((a) => a.status === "late").length;
      const total = sAtt.length;
      const rate = total > 0 ? Math.round((presentCount / total) * 100 * 10) / 10 : 100;

      // Consecutive absences
      const sorted = sAtt
        .filter((a) => a.status === "absent")
        .map((a) => a.date)
        .sort();
      let maxConsecutive = 0;
      let currentStreak = 0;
      for (let i = 0; i < sorted.length; i++) {
        if (i === 0) {
          currentStreak = 1;
        } else {
          const prev = new Date(sorted[i - 1]);
          const curr = new Date(sorted[i]);
          const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
          if (diff <= 3) {
            currentStreak++;
          } else {
            currentStreak = 1;
          }
        }
        maxConsecutive = Math.max(maxConsecutive, currentStreak);
      }

      return {
        studentId: s.id,
        name: s.name,
        photoUrl: s.photoUrl,
        className: s.classId ? classMap[s.classId] ?? null : null,
        attendanceRate: rate,
        totalDays: total,
        presentCount,
        absentCount,
        lateCount,
        maxConsecutiveAbsences: maxConsecutive,
        concern: rate < 80 || maxConsecutive >= 3,
      };
    });

    result.sort((a, b) => a.attendanceRate - b.attendanceRate);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fees investigation: students with outstanding balances
router.get("/intelligence/fees", requireAuth, async (req, res) => {
  try {
    const students = await db.select().from(studentsTable);
    const allFees = await db.select().from(feesTable);
    const classes = await db.select().from(classesTable);
    const classMap = Object.fromEntries(classes.map((c) => [c.id, c.name]));

    const result = students.map((s) => {
      const sFees = allFees.filter((f) => f.studentId === s.id);
      const totalExpected = sFees.reduce((sum, f) => sum + parseFloat(f.totalAmount), 0);
      const totalPaid = sFees.reduce((sum, f) => sum + parseFloat(f.amountPaid), 0);
      const balance = totalExpected - totalPaid;
      const rate = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 100;
      const status =
        balance <= 0 ? "paid" : totalPaid > 0 ? "partial" : "unpaid";
      const termBreakdown = sFees.map((f) => ({
        term: f.term,
        total: parseFloat(f.totalAmount),
        paid: parseFloat(f.amountPaid),
        balance: parseFloat(f.totalAmount) - parseFloat(f.amountPaid),
        status:
          parseFloat(f.amountPaid) >= parseFloat(f.totalAmount)
            ? "paid"
            : parseFloat(f.amountPaid) > 0
              ? "partial"
              : "unpaid",
      }));

      return {
        studentId: s.id,
        name: s.name,
        photoUrl: s.photoUrl,
        className: s.classId ? classMap[s.classId] ?? null : null,
        totalExpected,
        totalPaid,
        balance,
        collectionRate: rate,
        status,
        termBreakdown,
        parentContact: s.parentContact,
      };
    });

    result.sort((a, b) => b.balance - a.balance);
    res.json(result.filter((r) => r.totalExpected > 0));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
