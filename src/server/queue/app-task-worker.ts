import "server-only";
import { refreshDuplicateReviewTasks, resolveDuplicateTask } from "@/server/exercises/duplicate-review-service";
import { rebuildSearchIndex } from "@/server/search/search-index-service";
import { claimNextAppTask, duplicateResolutionPayloadSchema, finishAppTask, updateAppTaskProgress } from "./app-task-repository";
let active: Promise<void> | undefined;

async function processDuplicateResolutions(taskId: string, payload: unknown): Promise<void> {
  const { resolutions } = duplicateResolutionPayloadSchema.parse(payload);
  for (const [index, item] of resolutions.entries()) {
    if (item.decision === "ignored" || item.decision === "both") {
      await resolveDuplicateTask(item.taskId, item.leftExerciseId, "ignored", item.decision === "both" ? "keep_both" : "not_duplicate");
    } else {
      await resolveDuplicateTask(item.taskId, item.decision === "right" ? item.rightExerciseId : item.leftExerciseId, "merged");
    }
    await updateAppTaskProgress(taskId, ((index + 1) / resolutions.length) * 100, `${index + 1} von ${resolutions.length} Dublettenentscheidungen verarbeitet`);
  }
}

async function process(): Promise<void> {
  while (true) {
    const task = await claimNextAppTask();
    if (!task) return;
    try {
      switch (task.taskType) {
        case "duplicate_scan":
          await refreshDuplicateReviewTasks();
          break;
        case "duplicate_resolve":
          await processDuplicateResolutions(task.id, task.payload);
          break;
        case "search_rebuild":
          await rebuildSearchIndex("de");
          await rebuildSearchIndex("en");
          break;
        default:
          throw new Error(`Unsupported app task type: ${String(task.taskType)}`);
      }
      await finishAppTask(task.id, "succeeded");
    } catch (error) {
      await finishAppTask(task.id, "failed", error instanceof Error ? error.message : String(error));
    }
  }
}

export function runAppTaskQueue():Promise<void>{active??=process().finally(()=>{active=undefined});return active;}
