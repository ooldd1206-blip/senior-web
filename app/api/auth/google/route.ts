import { NextResponse } from "next/server";

const client_id = process.env.GOOGLE_CLIENT_ID!;
const redirect_uri = process.env.GOOGLE_REDIRECT_URI!;
const APP_URL = process.env.APP_URL!;

export async function GET() {
  const scope = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ].join(" ");

  const googleAuthURL = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthURL.searchParams.set("client_id", client_id);
  googleAuthURL.searchParams.set("redirect_uri", redirect_uri);
  googleAuthURL.searchParams.set("response_type", "code");
  googleAuthURL.searchParams.set("scope", scope);
  googleAuthURL.searchParams.set("prompt", "consent");

  return NextResponse.redirect(googleAuthURL.toString());
}
