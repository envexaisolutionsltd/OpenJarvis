import { NextRequest, NextResponse } from "next/server";
import { cancelRuntimeRun } from "@/lib/server/runtime";
export const dynamic="force-dynamic";
export async function POST(_request:NextRequest,context:{params:Promise<{runId:string}>}){
 try{const {runId}=await context.params;return NextResponse.json(await cancelRuntimeRun(runId));}
 catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to cancel run"},{status:503});}
}
