import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const records = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, user.id));
    records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    res.json(records.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/notifications/:id/read", requireAuth, async (req, res) => {
  try {
    await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.id, parseInt(req.params.id)));
    res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/notifications/read-all", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.userId, user.id));
    res.json({ success: true, message: "All marked as read" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
