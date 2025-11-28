import { cookies } from "next/headers";
import { COOKIE_NAME, signToken, verifyToken, JWTPayload } from "./auth";

export async function setSessionCookie(payload: JWTPayload) {
  const token = await signToken(payload);
  (await cookies()).set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function clearSessionCookie() {
  (await cookies()).set({ name: COOKIE_NAME, value: "", maxAge: 0, path: "/" });
}

export async function getSession(cookieReq: Request) {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}
