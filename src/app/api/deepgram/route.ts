import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.DEEPGRAM_API_KEY) {
    return NextResponse.json(
      { error: "Deepgram API key not configured" },
      { status: 501 }
    );
  }
  
  return NextResponse.json({
    key: process.env.DEEPGRAM_API_KEY,
  });
}
