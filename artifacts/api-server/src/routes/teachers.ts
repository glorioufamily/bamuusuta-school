import { Router } from "express";
import { db } from "@workspace/db";
import { teachersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

function enrichTeacher(t: any) {
  return {
    ...t,
    performanceScore: t.performanceScore !== null ? parseFloat(t.performanceScore) : null,
    attendanceRate: t.attendanceRate !== null ? parseFloat(t.attendanceRate) : null,
    classIds: [],
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/teachers", requireAuth, async (req, res) => {
  try {
    const teachers = await db.select().from(teachersTable);
    res.json(teachers.map(enrichTeacher));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/teachers", requireAuth, async (req, res) => {
  try {
    const { name, subject, photoUrl, email, phone } = req.body;
    const [teacher] = await db.insert(teachersTable).values({
      name, subject,
      photoUrl: photoUrl ?? null,
      email: email ?? null,
      phone: phone ?? null,
      performanceScore: "70",
      attendanceRate: "90",
      marksSubmitted: 0,
    }).returning();
    res.status(201).json(enrichTeacher(teacher));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/teachers/:id", requireAuth, async (req, res) => {
  try {
    const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.id, parseInt(req.params.id)));
    if (!teacher) { res.status(404).json({ error: "Not found" }); return; }
    res.json(enrichTeacher(teacher));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/teachers/:id", requireAuth, async (req, res) => {
  try {
    const { name, subject, photoUrl, email, phone } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (subject !== undefined) updates.subject = subject;
    if (photoUrl !== undefined) updates.photoUrl = photoUrl;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    const [updated] = await db.update(teachersTable).set(updates).where(eq(teachersTable.id, parseInt(req.params.id))).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(enrichTeacher(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
