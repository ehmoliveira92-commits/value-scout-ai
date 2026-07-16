
import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase";

export async function GET(){
  const db=getAdminSupabase();
  if(!db) return NextResponse.json({mode:"local",signals:[]});
  const {data,error}=await db.from("signals").select("*").order("created_at",{ascending:false}).limit(500);
  if(error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({mode:"database",signals:data});
}
export async function POST(request:NextRequest){
  const signal=await request.json();
  const db=getAdminSupabase();
  if(!db) return NextResponse.json({mode:"local",signal});
  const {data,error}=await db.from("signals").insert(signal).select().single();
  if(error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({mode:"database",signal:data});
}
export async function PATCH(request:NextRequest){
  const {id,status}=await request.json();
  const db=getAdminSupabase();
  if(!db) return NextResponse.json({mode:"local"});
  const {data,error}=await db.from("signals").update({status}).eq("id",id).select().single();
  if(error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({mode:"database",signal:data});
}
