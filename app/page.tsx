
"use client";
import {useEffect,useMemo,useState} from "react";

type Game=any;
type Line={market:string;side:"home"|"away";line:number;odd:number;period:string};

export default function Home(){
 const [date,setDate]=useState(new Date().toISOString().slice(0,10));
 const [games,setGames]=useState<Game[]>([]);
 const [status,setStatus]=useState("Verificando...");
 const [selected,setSelected]=useState<Game|null>(null);
 const [lines,setLines]=useState<Line[]>([]);
 const [signals,setSignals]=useState<any[]>([]);
 const [loading,setLoading]=useState(false);

 useEffect(()=>{fetch("/api/health").then(r=>r.json()).then(j=>setStatus(j.apiFootball?"API conectada":"Falta configurar a chave")).catch(()=>setStatus("Erro"));},[]);
 const defaults=(g:Game):Line[]=>[
  {market:"Chutes",side:"home",line:8.5,odd:1.30,period:"Jogo todo"},
  {market:"Chutes",side:"away",line:7.5,odd:1.30,period:"Jogo todo"},
  {market:"Chutes certos",side:"home",line:3.5,odd:1.40,period:"Jogo todo"},
  {market:"Escanteios",side:"home",line:3.5,odd:1.40,period:"Jogo todo"},
  {market:"Cartões",side:"home",line:1.5,odd:1.40,period:"Jogo todo"},
  {market:"Gols",side:"home",line:.5,odd:1.35,period:"Jogo todo"}
 ];
 async function load(){
  setStatus("Carregando...");
  const j=await (await fetch(`/api/fixtures?date=${date}`)).json();
  if(j.error){setStatus(j.error);return}
  setGames(j.games);setStatus(`${j.games.length} jogos`);
 }
 function open(g:Game){setSelected(g);setLines(defaults(g));setSignals([])}
 function update(i:number,key:string,value:any){setLines(ls=>ls.map((x,n)=>n===i?{...x,[key]:value}:x))}
 async function analyze(){
  if(!selected)return;setLoading(true);
  const j=await (await fetch("/api/analysis",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fixture:selected.id,lines})})).json();
  setLoading(false);if(j.error){alert(j.error);return}setSignals(j.signals);
 }
 async function save(s:any){
  const payload={fixture_id:selected.id,match:`${selected.home.name} x ${selected.away.name}`,market:s.market,selection:`${s.side==="home"?selected.home.name:selected.away.name} +${s.line}`,line:s.line,odd:s.odd,score:s.score,status:"Pendente",metadata:s};
  const r=await fetch("/api/signals",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const j=await r.json();
  if(j.mode==="local"){const h=JSON.parse(localStorage.getItem("vs_signals")||"[]");h.unshift(payload);localStorage.setItem("vs_signals",JSON.stringify(h))}
  alert("Sinal salvo.");
 }
 return <main className="app">
  <header className="header"><div className="brand"><div className="logo">VS</div><div><h1>Value Scout AI</h1><div className="muted small">V1.1 • dados reais + linhas da Bet365</div></div></div><div className="small muted">{status}</div></header>
  <div className="toolbar"><input type="date" value={date} onChange={e=>setDate(e.target.value)}/><button className="primary" onClick={load}>Carregar jogos</button></div>
  <section className="grid">{games.map(g=><article className="card" key={g.id}><div className="muted small">{g.league.name} • {g.league.country}</div><div className="teams"><div className="team"><img src={g.home.logo}/>{g.home.name}</div><div className="team"><img src={g.away.logo}/>{g.away.name}</div></div><button className="primary" onClick={()=>open(g)}>Analisar</button></article>)}</section>
  {selected&&<div className="modal"><section className="sheet">
   <div style={{display:"flex",justifyContent:"space-between",gap:10}}><div><div className="muted small">{selected.league.name}</div><h2>{selected.home.name} x {selected.away.name}</h2></div><button onClick={()=>setSelected(null)}>Fechar</button></div>
   {!signals.length&&<><p className="muted small">Digite as linhas e odds exatamente como aparecem na Bet365.</p>
   {lines.map((l,i)=><div className="line" key={i}>
    <select value={l.market} onChange={e=>update(i,"market",e.target.value)}>{["Chutes","Chutes certos","Escanteios","Cartões","Gols"].map(x=><option key={x}>{x}</option>)}</select>
    <select value={l.side} onChange={e=>update(i,"side",e.target.value)}><option value="home">{selected.home.name}</option><option value="away">{selected.away.name}</option></select>
    <input type="number" step=".5" value={l.line} onChange={e=>update(i,"line",+e.target.value)}/>
    <input type="number" step=".01" value={l.odd} onChange={e=>update(i,"odd",+e.target.value)}/>
    <button className="danger" onClick={()=>setLines(x=>x.filter((_,n)=>n!==i))}>Excluir</button>
   </div>)}
   <div className="toolbar"><button onClick={()=>setLines(x=>[...x,{market:"Chutes",side:"home",line:8.5,odd:1.30,period:"Jogo todo"}])}>Adicionar linha</button><button className="primary" onClick={analyze}>{loading?"Analisando...":"Gerar sinais"}</button></div></>}
   {!!signals.length&&<><button onClick={()=>setSignals([])}>Voltar às linhas</button>{signals.map((s,i)=><div className="signal" key={i}><div><b>{s.side==="home"?selected.home.name:selected.away.name} — Mais de {s.line} {s.market.toLowerCase()}</b><div className="small">{s.tier} • odd {s.odd.toFixed(2)} • EV {s.ev}%</div><div className="chips"><span className="chip">Média {s.ownAvg}</span><span className="chip">Adversário cede {s.allowedAvg}</span><span className="chip">Projeção {s.projection}</span><span className="chip">Bateu {s.hitRate}%</span><span className="chip">Odd justa {s.fairOdd}</span></div><button style={{marginTop:8}} onClick={()=>save(s)}>Salvar sinal</button></div><div className="score">{s.score}</div></div>)}</>}
  </section></div>}
 </main>
}
