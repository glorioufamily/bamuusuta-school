import { Router } from "express";
import { db } from "@workspace/db";
import { announcementsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

async function enrichAnnouncement(a: any) {
  const [author] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, a.authorId));
  return { ...a, authorName: author?.name ?? null, createdAt: a.createdAt.toISOString() };
}

router.get("/announcements", async (req, res) => {
  try {
    const { visibility } = req.query;
    const records = visibility
      ? await db.select().from(announcementsTable).where(eq(announcementsTable.visibility, visibility as string))
      : await db.select().from(announcementsTable);
    const enriched = await Promise.all(records.map(enrichAnnouncement));
    enriched.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/announcements", requireAuth, async (req, res) => {
  try {
    const { title, content, visibility, category, imageUrl, pinned } = req.body;
    const user = (req as any).user;
    const [record] = await db.insert(announcementsTable).values({
      title, content, authorId: user.id,
      visibility: visibility ?? "public",
      category: category ?? "general",
      imageUrl: imageUrl ?? null,
      pinned: pinned ?? false,
    }).returning();
    res.status(201).json(await enrichAnnouncement(record));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/announcements/:id", requireAuth, async (req, res) => {
  try {
    const updates: any = {};
    const fields = ["title", "content", "visibility", "category", "pinned"];
    for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];
    const [updated] = await db.update(announcementsTable).set(updates).where(eq(announcementsTable.id, parseInt(req.params.id))).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await enrichAnnouncement(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/announcements/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(announcementsTable).where(eq(announcementsTable.id, parseInt(req.params.id)));
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
