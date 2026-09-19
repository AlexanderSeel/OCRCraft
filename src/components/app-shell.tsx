import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getOptionalCurrentActor } from "@/server/auth/identity-service";
import { AppShellClient } from "./app-shell-client";

interface AppShellProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}

export async function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  const actor = await getOptionalCurrentActor();
  if (!actor) redirect("/login");
  return <AppShellClient actions={actions} currentUser={{ displayName: actor.displayName, role: actor.role }} subtitle={subtitle} title={title}>{children}</AppShellClient>;
}
