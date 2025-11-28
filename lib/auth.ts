import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret");
const ALG = "HS256";
export const COOKIE_NAME = "sc_token";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30天

export type JWTPayload = { sub: string; email: string; displayName: string };

export async function signToken(payload: JWTPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(secret);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as JWTPayload;
}
