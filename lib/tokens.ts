import crypto from "crypto";

export function generateToken(length: number = 32) {
  return crypto.randomBytes(length).toString("hex");
}
