
import { NextRequest, NextResponse } from "next/server";
import { apiFootball, stat, average } from "@/lib/api-football";

type Row = {
  goals:number; goalsAllowed:number; shots:number; sot:number; corners:number; cards:number;
  possession:number; shotsAllowed:number; sotAllowed:number; cornersAllowed:number; cardsAllowed:number;
};
type Market = "Chutes"|"Chutes certos"|"Escanteios"|"Cartões"|"Gols";
type Line = { market:Market; side:"home"|"away"; line:number; odd:number; period:"Jogo todo"|"1º tempo"|"2º tempo" };

async function recent(team:number,last:number,season:number):Promise<Row[]> {
  const from = "2024-01-01";
  const to = "2024-12-31";
  const fixtures = await apiFootball(`/fixtures?team=${team}&season=${season}&from=${from}&to=${to}&status=FT`);
  fixtures.response = (fixtures.response || []).slice(-last);
  const rows:Row[] = [];
  for (const fixture of fixtures.response || []) {
    const stats = await apiFootball(`/fixtures/statistics?fixture=${fixture.fixture.id}`);
    const own = (stats.response || []).find((x:any)=>x.team.id===team);
    const opp = (stats.response || []).find((x:any)=>x.team.id!==team);
    const home = fixture.teams.home.id===team;
    rows.push({
      goals: home?fixture.goals.home:fixture.goals.away,
      goalsAllowed: home?fixture.goals.away:fixture.goals.home,
      shots: stat(own?.statistics,"Total Shots"),
      sot: stat(own?.statistics,"Shots on Goal"),
      corners: stat(own?.statistics,"Corner Kicks"),
      cards: stat(own?.statistics,"Yellow Cards")+stat(own?.statistics,"Red Cards"),
      possession: stat(own?.statistics,"Ball Possession"),
      shotsAllowed: stat(opp?.statistics,"Total Shots"),
      sotAllowed: stat(opp?.statistics,"Shots on Goal"),
      cornersAllowed: stat(opp?.statistics,"Corner Kicks"),
      cardsAllowed: stat(opp?.statistics,"Yellow Cards")+stat(opp?.statistics,"Red Cards")
    });
  }
  return rows;
}
function keys(market:Market){
  if(market==="Chutes") return ["shots","shotsAllowed"] as const;
  if(market==="Chutes certos") return ["sot","sotAllowed"] as const;
  if(market==="Escanteios") return ["corners","cornersAllowed"] as const;
  if(market==="Cartões") return ["cards","cardsAllowed"] as const;
  return ["goals","goalsAllowed"] as const;
}
function evaluate(line:Line,own:Row[],opp:Row[],context:number){
  const [ownKey,allowKey]=keys(line.market);
  const ownAvg=average(own,r=>r[ownKey]);
  const allowedAvg=average(opp,r=>r[allowKey]);
  const projection=ownAvg*.58+allowedAvg*.42;
  const margin=projection-line.line;
  const hits=own.length?own.filter(r=>r[ownKey]>line.line).length/own.length:0;
  const implied=line.odd>1?1/line.odd:1;
  const marginScore=Math.max(0,Math.min(100,55+margin*10));
  const consistency=hits*100;
  const priceScore=Math.max(0,Math.min(100,60+(0.82-implied)*120));
  let score=marginScore*.42+consistency*.30+priceScore*.13+context*.15-(line.period==="Jogo todo"?0:6);
  score=Math.round(Math.max(35,Math.min(96,score)));
  const fairProb=Math.max(.42,Math.min(.94,.52+margin*.055+(hits-.5)*.20));
  return {
    ...line,score,
    tier:score>=90?"Muito forte":score>=80?"Valor interessante":score>=70?"Agressivo":"Sem indicação",
    ownAvg:+ownAvg.toFixed(1),allowedAvg:+allowedAvg.toFixed(1),projection:+projection.toFixed(1),
    margin:+margin.toFixed(1),hitRate:Math.round(hits*100),fairOdd:+(1/fairProb).toFixed(2),
    ev:+((fairProb*line.odd-1)*100).toFixed(1)
  };
}
export async function POST(request:NextRequest){
  try{
    const body=await request.json();
    const fixture=Number(body.fixture);
    const lines:Line[]=body.lines||[];
    if(!fixture || !lines.length) return NextResponse.json({error:"Jogo e linhas são obrigatórios."},{status:400});
    const detail=await apiFootball(`/fixtures?id=${fixture}`);
    const game=detail.response?.[0];
    if(!game) return NextResponse.json({error:"Jogo não encontrado."},{status:404});
    const [home5,away5] = await Promise.all([
      recent(game.teams.home.id,3,2024),
      recent(game.teams.away.id,3,2024)
    ]);
    const home10 = home5;
    const away10 = away5;
    const context=(rows:Row[])=>65+Math.min(15,rows.filter(r=>r.goals>r.goalsAllowed).length*2);
    const signals=lines.map(l=>evaluate(l,l.side==="home"?home5:away5,l.side==="home"?away5:home5,l.side==="home"?context(home10):context(away10)))
      .filter((s)=>s.ev>0 && s.score>=75).sort((a,b)=>(b.ev-a.ev)||(b.score-a.score));
    return NextResponse.json({
      fixture:{id:fixture,league:game.league,home:game.teams.home,away:game.teams.away,kickoff:game.fixture.date},
      summary:{
        home:{shots:average(home5,r=>r.shots),sot:average(home5,r=>r.sot),corners:average(home5,r=>r.corners),cards:average(home5,r=>r.cards),goals:average(home5,r=>r.goals)},
        away:{shots:average(away5,r=>r.shots),sot:average(away5,r=>r.sot),corners:average(away5,r=>r.corners),cards:average(away5,r=>r.cards),goals:average(away5,r=>r.goals)}
      },
      signals,
      disclaimer:"Score comparativo inicial. Ele será calibrado com o histórico real dos sinais."
    });
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Erro desconhecido"},{status:500});
  }
}
