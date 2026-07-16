
import { NextRequest, NextResponse } from "next/server";
import { apiFootball } from "@/lib/api-football";

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const timezone = request.nextUrl.searchParams.get("timezone") || "America/Sao_Paulo";
    const data = await apiFootball(`/fixtures?date=${encodeURIComponent(date)}&timezone=${encodeURIComponent(timezone)}`);
    const games = (data.response || []).map((x: any) => ({
      id: x.fixture.id,
      date: x.fixture.date,
      status: x.fixture.status.short,
      league: { id:x.league.id, name:x.league.name, country:x.league.country, season:x.league.season, logo:x.league.logo },
      home: { id:x.teams.home.id, name:x.teams.home.name, logo:x.teams.home.logo },
      away: { id:x.teams.away.id, name:x.teams.away.name, logo:x.teams.away.logo },
      goals: x.goals
    }));
    return NextResponse.json({ games });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 });
  }
}
