import "server-only";
import { refreshDuplicateReviewTasks, resolveDuplicateTask } from "@/server/exercises/duplicate-review-service";
import { rebuildSearchIndex } from "@/server/search/search-index-service";
import { claimNextAppTask, finishAppTask } from "./app-task-repository";
let active: Promise<void>|undefined;
interface Resolution { taskId:string; leftExerciseId:string; rightExerciseId:string; decision:string; }
async function process():Promise<void>{while(true){const task=await claimNextAppTask();if(!task)return;try{if(task.taskType==='duplicate_scan') await refreshDuplicateReviewTasks(); else if(task.taskType==='search_rebuild'){await rebuildSearchIndex('de');await rebuildSearchIndex('en');} else {const payload=task.payload as {resolutions?:Resolution[]}; for(const item of payload.resolutions??[]){if(item.decision==='ignored'||item.decision==='both') await resolveDuplicateTask(item.taskId,item.leftExerciseId,'ignored',item.decision==='both'?'keep_both':'not_duplicate'); else await resolveDuplicateTask(item.taskId,item.decision==='right'?item.rightExerciseId:item.leftExerciseId,'merged');}} await finishAppTask(task.id,'succeeded');}catch(e){await finishAppTask(task.id,'failed',e instanceof Error?e.message:String(e));}}}
export function runAppTaskQueue():Promise<void>{active??=process().finally(()=>{active=undefined});return active;}
