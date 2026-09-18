import { NextResponse } from "next/server";
import { getAppTaskSummary } from "@/server/queue/app-task-repository";
export async function GET(){ return NextResponse.json(await getAppTaskSummary(), { headers: { "cache-control": "no-store" } }); }
