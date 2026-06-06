import { Router } from "express";
import { db } from "@workspace/db";
import { schoolBrandingTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/branding", async (req, res) => {
  try {
    const [branding] = await db.select().from(schoolBrandingTable).limit(1);
    if (!branding) {
      res.json({
        id: 0,
        schoolName: "Greenfield Academy",
        motto: "Nurturing Tomorrow's Leaders Today",
        logoUrl: null,
        contactInfo: null,
        address: null,
        email: null,
        website: null,
        welcomeMessage: null,
        updatedAt: new Date().toISOString(),
      });
      return;
    }
    res.json({ ...branding, updatedAt: branding.updatedAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/branding", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== "admin") {
      res.status(403).json({ error: "Admin only" });
      return;
    }
    const fields = ["schoolName", "motto", "logoUrl", "contactInfo", "address", "email", "website", "welcomeMessage"];
    const updates: any = { updatedAt: new Date() };
    for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];

    const [existing] = await db.select().from(schoolBrandingTable).limit(1);
    let result;
    if (existing) {
      const [updated] = await db.update(schoolBrandingTable).set(updates).returning();
      result = updated;
    } else {
      const [inserted] = await db.insert(schoolBrandingTable).values({
        schoolName: req.body.schoolName ?? "Greenfield Academy",
        ...updates,
      }).returning();
      result = inserted;
    }
    res.json({ ...result, updatedAt: result.updatedAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
