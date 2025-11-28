import { clearSessionCookie } from "@/lib/cookies";

export async function POST() {
  clearSessionCookie();
  return Response.json({ ok: true });
}
