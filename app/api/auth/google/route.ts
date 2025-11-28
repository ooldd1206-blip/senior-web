import { NextResponse } from "next/server";

const client_id = process.env.GOOGLE_CLIENT_ID!;
const redirect_uri = process.env.GOOGLE_REDIRECT_URI!;

export async function GET() {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  url.searchParams.set("client_id", client_id);
  url.searchParams.set("redirect_uri", redirect_uri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(url.toString());
}
