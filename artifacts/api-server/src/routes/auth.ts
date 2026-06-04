import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, createToken, requireAuth } from "../lib/auth";

const router = Router();

router.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Username and password required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const hashed = hashPassword(password);
    if (user.passwordHash !== hashed) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = createToken(user.id, user.role);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl ?? null,
        linkedId: user.linkedId ?? null,
      },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logout", (_req, res) => {
  res.json({ success: true, message: "Logged out" });
});

router.get("/auth/me", requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    linkedId: user.linkedId ?? null,
  });
});

export default router;
