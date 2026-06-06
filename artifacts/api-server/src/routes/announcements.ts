import { Router } from "express";
import { db } from "@workspace/db";
import { announcementsTable, usersTable, clubsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

async function enrichAnnouncement(a: any) {
  const [author] = await db.select({ name: usersTable.name, role: usersTable.role, linkedId: usersTable.linkedId, avatarUrl: usersTable.avatarUrl })
    .from(usersTable).where(eq(usersTable.id, a.authorId));

  let authorLogoUrl: string | null = author?.avatarUrl ?? null;
  let authorDisplayName: string | null = author?.name ?? null;
  let authorRole: string | null = author?.role ?? null;

  if (author?.role === "club" && author.linkedId) {
    const [club] = await db.select({ name: clubsTable.name, logoUrl: clubsTable.logoUrl })
      .from(clubsTable).where(eq(clubsTable.id, author.linkedId));
    if (club) {
      authorDisplayName = club.name;
      authorLogoUrl = club.logoUrl ?? null;
    }
  }

  return {
    ...a,
    authorName: authorDisplayName,
    authorRole,
    authorLogoUrl,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
  };
}

router.get("/announcements", async (req, res) => {
  try {
    const { visibility, clubId } = req.query;
    let records;
    if (visibility && clubId) {
      records = await db.select().from(announcementsTable)
        .where(and(eq(announcementsTable.visibility, visibility as string), eq(announcementsTable.clubId, parseInt(clubId as string))));
    } else if (visibility) {
      records = await db.select().from(announcementsTable).where(eq(announcementsTable.visibility, visibility as string));
    } else if (clubId) {
      records = await db.select().from(announcementsTable).where(eq(announcementsTable.clubId, parseInt(clubId as string)));
    } else {
      records = await db.select().from(announcementsTable);
    }
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
    const { title, content, visibility, category, imageUrl, videoUrl, documentUrl, externalLink, eventDate, pinned } = req.body;
    const user = (req as any).user;

    const allowedRoles = ["admin", "headteacher", "dos", "club"];
    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({ error: "Not authorized to create announcements" });
      return;
    }

    let clubId: number | null = null;
    if (user.role === "club" && user.linkedId) {
      clubId = user.linkedId;
    }

    const [record] = await db.insert(announcementsTable).values({
      title, content, authorId: user.id,
      visibility: visibility ?? "public",
      category: category ?? "general",
      imageUrl: imageUrl ?? null,
      videoUrl: videoUrl ?? null,
      documentUrl: documentUrl ?? null,
      externalLink: externalLink ?? null,
      eventDate: eventDate ?? null,
      clubId,
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
    const user = (req as any).user;
    const announcementId = parseInt(req.params.id);
    const [existing] = await db.select().from(announcementsTable).where(eq(announcementsTable.id, announcementId));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }

    if (user.role === "club" && existing.authorId !== user.id) {
      res.status(403).json({ error: "Cannot edit another club's announcement" });
      return;
    }

    const updates: any = {};
    const fields = ["title", "content", "visibility", "category", "imageUrl", "videoUrl", "documentUrl", "externalLink", "eventDate", "pinned"];
    for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];
    const [updated] = await db.update(announcementsTable).set(updates).where(eq(announcementsTable.id, announcementId)).returning();
    res.json(await enrichAnnouncement(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/announcements/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const announcementId = parseInt(req.params.id);
    const [existing] = await db.select().from(announcementsTable).where(eq(announcementsTable.id, announcementId));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }

    if (user.role === "club" && existing.authorId !== user.id) {
      res.status(403).json({ error: "Cannot delete another club's announcement" });
      return;
    }

    await db.delete(announcementsTable).where(eq(announcementsTable.id, announcementId));
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
