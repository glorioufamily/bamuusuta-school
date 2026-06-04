import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { createHmac } from "crypto";
import { eq } from "drizzle-orm";

const SECRET = process.env.SESSION_SECRET ?? "edumaster-secret-key";

function hashPassword(password: string): string {
  return createHmac("sha256", SECRET).update(password).digest("hex");
}

async function seedPasswords() {
  const credentials = [
    { username: "admin", password: "admin123" },
    { username: "headteacher", password: "head123" },
    { username: "dos", password: "dos123" },
    { username: "teacher1", password: "teacher123" },
    { username: "teacher2", password: "teacher123" },
    { username: "teacher3", password: "teacher123" },
    { username: "teacher4", password: "teacher123" },
    { username: "bursar", password: "bursar123" },
    { username: "student1", password: "student123" },
    { username: "student2", password: "student123" },
    { username: "parent1", password: "parent123" },
  ];

  for (const { username, password } of credentials) {
    const hash = hashPassword(password);
    const result = await db.update(usersTable)
      .set({ passwordHash: hash })
      .where(eq(usersTable.username, username));
    console.log(`Updated password for: ${username}`);
  }

  console.log("All passwords updated successfully!");
  process.exit(0);
}

seedPasswords().catch(e => {
  console.error(e);
  process.exit(1);
});
