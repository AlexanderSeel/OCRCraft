import "server-only";
import { refreshDuplicateReviewTasks } from "@/server/exercises/duplicate-review-service";
import { rebuildSearchIndex } from "@/server/search/search-index-service";
import { claimNextAppTask, finishAppTask } from "./app-task-repository";
let active: Promise<void>|undefined;
async function process():Promise<void>{ while(true){const task=await claimNextAppTask();if(!task)return;try{if(task.taskType==='duplicate_scan') await refreshDuplicateReviewTasks(); else {await rebuildSearchIndex('de');await rebuildSearchIndex('en');} await finishAppTask(task.id,'succeeded');}catch(e){await finishAppTask(task.id,'failed',e instanceof Error?e.message:String(e));}}}
export function runAppTaskQueue():Promise<void>{active??=process().finally(()=>{active=undefined});return active;}
