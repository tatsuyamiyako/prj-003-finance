import { NextRequest, NextResponse } from "next/server";
import { writeFileSync } from "fs";
import { join } from "path";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = "http://localhost:3000/api/auth/google/callback";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  const data = await res.json();

  if (data.error) {
    return NextResponse.json(data, { status: 400 });
  }

  const tokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };

  const tokenPath = join(process.cwd(), ".google-token.json");
  writeFileSync(tokenPath, JSON.stringify(tokenData, null, 2));

  return NextResponse.json({
    message: "Google Calendar 連携が完了しました！スケジュールを更新するとカレンダーに同期されます。",
    expires_in_minutes: Math.floor(data.expires_in / 60),
  });
}
