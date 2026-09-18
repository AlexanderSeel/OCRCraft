import { NextResponse } from "next/server";
import { getAppTaskSummary, listQueueIssues } from "@/server/queue/app-task-repository";
export async function GET(){ try { const [summary,issues]=await Promise.all([getAppTaskSummary(),listQueueIssues(12)]); return NextResponse.json({ ...summary, issues }, { headers: { "cache-control": "no-store" } }); } catch { return NextResponse.json({ queued:0,running:0,failed:0,issues:[],stale:true }, { headers: { "cache-control": "no-store" } }); } }
