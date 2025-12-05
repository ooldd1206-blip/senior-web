import { NextResponse } from "next/server";

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.FB_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/facebook/callback`,
    response_type: "code",
    scope: "email,public_profile",
  });

  return NextResponse.redirect(
    `https://www.facebook.com/v12.0/dialog/oauth?${params.toString()}`
  );
}
