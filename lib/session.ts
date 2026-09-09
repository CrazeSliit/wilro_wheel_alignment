import { cookies } from "next/headers";
import { createHmac } from "crypto";

const SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me";
const COOKIE = "im_session";

export type SessionData = {
  userId: string;
  role: "ADMIN" | "EMPLOYEE" | "MANAGER";
  name: string;
};

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

export async function setSession(data: SessionData): Promise<void> {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64");
  const sig = sign(payload);
  const store = await cookies();
  store.set(COOKIE, `${payload}.${sig}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export async function getSession(): Promise<SessionData | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;

  const lastDot = raw.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = raw.slice(0, lastDot);
  const sig = raw.slice(lastDot + 1);

  if (sign(payload) !== sig) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64").toString("utf-8")) as SessionData;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
