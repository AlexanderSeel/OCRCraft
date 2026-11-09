export type BuilderView = "quick" | "detailed";

export function resolveBuilderView(params: { readonly planner?: string | null; readonly source?: string | null; readonly mode?: string | null }): BuilderView {
  if (params.planner === "quick" || params.planner === "detailed") return params.planner;
  return params.source || params.mode === "ai" || params.mode === "local" ? "detailed" : "quick";
}
