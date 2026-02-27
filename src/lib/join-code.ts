import crypto from "crypto";

export function generateJoinCode() {
  const a = crypto.randomBytes(2).toString("hex").toUpperCase();
  const b = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${a}-${b}`;
}

export function hashJoinCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}
