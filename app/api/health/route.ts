
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    ok: true,
    apiFootball: Boolean(process.env.API_FOOTBALL_KEY),
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    version: "1.1.0"
  });
}
