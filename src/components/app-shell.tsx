import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getOptionalCurrentActor } from "@/server/auth/identity-service";
import { AppShellClient } from "./app-shell-client";
import type { BreadcrumbSection } from "@/components/navigation/breadcrumbs";

interface AppShellProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly breadcrumbSection?: BreadcrumbSection;
}

export async function AppShell({ title, subtitle, actions, children, breadcrumbSection }: AppShellProps) {
  const actor = await getOptionalCurrentActor();
  if (!actor) redirect("/login");
  return <AppShellClient actions={actions} breadcrumbSection={breadcrumbSection} currentUser={{ displayName: actor.displayName, role: actor.role }} subtitle={subtitle} title={title}>{children}</AppShellClient>;
}
