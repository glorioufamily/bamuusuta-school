import { Router } from "express";
import { db } from "@workspace/db";
import { suggestionsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

function classifyPriority(message: string, category: string): string {
  const urgent = ["urgent", "emergency", "immediately", "danger", "safety"];
  const low = ["suggestion", "maybe", "consider", "would be nice"];
  const msg = message.toLowerCase();
  if (urgent.some(w => msg.includes(w)) || category === "discipline") return "high";
  if (low.some(w => msg.includes(w))) return "low";
  return "medium";
}

async function enrichSuggestion(s: any) {
  let senderName: string | null = null;
  let senderRole: string | null = null;
  if (s.senderId && !s.anonymous) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, s.senderId));
    senderName = user?.name ?? null;
    senderRole = user?.role ?? null;
  }
  return { ...s, senderName: s.anonymous ? null : senderName, senderRole: s.anonymous ? null : senderRole, createdAt: s.createdAt.toISOString() };
}

router.get("/suggestions", requireAuth, async (req, res) => {
  try {
    const records = await db.select().from(suggestionsTable);
    const enriched = await Promise.all(records.map(enrichSuggestion));
    enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/suggestions", requireAuth, async (req, res) => {
  try {
    const { message, category, anonymous } = req.body;
    const user = (req as any).user;
    const priority = classifyPriority(message, category);
    const [record] = await db.insert(suggestionsTable).values({
      message, category: category ?? "other",
      priority, status: "pending",
      senderId: anonymous ? null : user?.id ?? null,
      anonymous: anonymous ?? false,
    }).returning();
    res.status(201).json(await enrichSuggestion(record));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/suggestions/:id", requireAuth, async (req, res) => {
  try {
    const [record] = await db.select().from(suggestionsTable).where(eq(suggestionsTable.id, parseInt(req.params.id)));
    if (!record) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await enrichSuggestion(record));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/suggestions/:id", requireAuth, async (req, res) => {
  try {
    const updates: any = {};
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (req.body.priority !== undefined) updates.priority = req.body.priority;
    if (req.body.adminResponse !== undefined) updates.adminResponse = req.body.adminResponse;
    const [updated] = await db.update(suggestionsTable).set(updates).where(eq(suggestionsTable.id, parseInt(req.params.id))).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await enrichSuggestion(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
