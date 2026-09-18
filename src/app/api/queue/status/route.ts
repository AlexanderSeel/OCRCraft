import { NextResponse } from "next/server";
import { getAppTaskSummary, listQueueIssues } from "@/server/queue/app-task-repository";
export async function GET(){ const [summary,issues]=await Promise.all([getAppTaskSummary(),listQueueIssues(12)]); return NextResponse.json({ ...summary, issues }, { headers: { "cache-control": "no-store" } }); }
