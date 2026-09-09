import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

export function generateTempPassword(length = 12): string {
  const bytes = randomBytes(length);
  let generated = "";

  for (let i = 0; i < length; i += 1) {
    generated += PASSWORD_CHARS[bytes[i] % PASSWORD_CHARS.length];
  }

  return generated;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");

    if (!salt || !hash) {
      return false;
    }

    const hashBuffer = Buffer.from(hash, "hex");
    const suppliedHash = scryptSync(password, salt, 64);

    if (hashBuffer.length !== suppliedHash.length) {
      return false;
    }

    return timingSafeEqual(hashBuffer, suppliedHash);
  } catch {
    return false;
  }
}
