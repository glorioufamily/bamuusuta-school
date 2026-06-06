import { Router } from "express";
import { db } from "@workspace/db";
import { clubsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { hashPassword } from "../lib/auth";

const router = Router();

router.get("/clubs", async (req, res) => {
  try {
    const clubs = await db.select().from(clubsTable);
    res.json(clubs.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/clubs", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== "admin") {
      res.status(403).json({ error: "Admin only" });
      return;
    }
    const { name, logoUrl, patron, description, username, password } = req.body;
    if (!name) {
      res.status(400).json({ error: "Club name is required" });
      return;
    }

    const [club] = await db.insert(clubsTable).values({ name, logoUrl, patron, description }).returning();

    if (username && password) {
      const passwordHash = hashPassword(password);
      const [clubUser] = await db.insert(usersTable).values({
        username,
        passwordHash,
        name,
        role: "club",
        avatarUrl: logoUrl ?? null,
        linkedId: club.id,
      }).returning();
      await db.update(clubsTable).set({ userId: clubUser.id }).where(eq(clubsTable.id, club.id));
      const [updated] = await db.select().from(clubsTable).where(eq(clubsTable.id, club.id));
      res.status(201).json({ ...updated, createdAt: updated.createdAt.toISOString() });
      return;
    }

    res.status(201).json({ ...club, createdAt: club.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/clubs/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== "admin") {
      res.status(403).json({ error: "Admin only" });
      return;
    }
    const fields = ["name", "logoUrl", "patron", "description"];
    const updates: any = {};
    for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];
    const [updated] = await db.update(clubsTable).set(updates).where(eq(clubsTable.id, parseInt(req.params.id))).returning();
    if (!updated) { res.status(404).json({ error: "Club not found" }); return; }
    if (req.body.logoUrl && updated.userId) {
      await db.update(usersTable).set({ avatarUrl: req.body.logoUrl }).where(eq(usersTable.id, updated.userId));
    }
    res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/clubs/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== "admin") {
      res.status(403).json({ error: "Admin only" });
      return;
    }
    const [club] = await db.select().from(clubsTable).where(eq(clubsTable.id, parseInt(req.params.id)));
    if (!club) { res.status(404).json({ error: "Club not found" }); return; }
    if (club.userId) {
      await db.delete(usersTable).where(eq(usersTable.id, club.userId));
    }
    await db.delete(clubsTable).where(eq(clubsTable.id, parseInt(req.params.id)));
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
