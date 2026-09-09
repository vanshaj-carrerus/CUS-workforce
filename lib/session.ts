import { cookies } from "next/headers";
import crypto from "crypto";
import { getDb } from "./mongodb";
import { isSuperAdmin } from "./permissions";
import type { Role } from "./types";

const COOKIE_NAME = "custech_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface SessionDoc {
  token: string;
  employeeId: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface SessionUser {
  employeeId: string;
  role: Role;
  email: string;
}

export async function createSession(employeeId: string): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex");
  const db = await getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await db.collection<SessionDoc>("sessions").insertOne({ token, employeeId, createdAt: now, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    try {
      const db = await getDb();
      await db.collection("sessions").deleteOne({ token });
    } catch {
      // Cookie is cleared below regardless.
    }
  }
  cookieStore.delete(COOKIE_NAME);
}

/** Resolves the current request's session cookie to a live employee identity, or null if not signed in. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const db = await getDb();
  const session = await db.collection<SessionDoc>("sessions").findOne({ token });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.collection("sessions").deleteOne({ token });
    return null;
  }

  const canonical = await db
    .collection<{ employeeId: string; role: Role; email: string }>("employees")
    .findOne({ employeeId: session.employeeId }, { projection: { _id: 0 } });
  if (canonical) return { employeeId: canonical.employeeId, role: canonical.role, email: canonical.email };

  const record = await db
    .collection<{ id: string; role?: Role; email: string; status: string }>("employeeRecords")
    .findOne({ id: session.employeeId }, { projection: { _id: 0 } });
  if (record && record.status !== "Inactive") {
    return { employeeId: record.id, role: record.role ?? "employee", email: record.email };
  }

  // Account was deleted or suspended after this session was issued.
  return null;
}

/** Returns the session user if their role is in `roles`, else null. Use with an early 401/403 return in route handlers. */
export async function requireRole(roles: Role[]): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) return null;
  return user;
}

/** Returns the session user if they're the fixed owner account, else null. */
export async function requireOwner(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || !isSuperAdmin(user)) return null;
  return user;
}
