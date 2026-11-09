import type { Metadata } from "next";
import type { Locale } from "@/i18n/dictionaries";
import { APP_VERSION } from "./app-version";

export const ROUTE_TITLES = {
  overview: { path: "/", de: "Dashboard", en: "Dashboard" },
  training: { path: "/training", de: "Trainings", en: "Training sessions" },
  trainingTemplates: { path: "/training/templates", de: "Trainingsvorlagen", en: "Training templates" },
  trainingBuilder: { path: "/training/builder", de: "Training Builder", en: "Training builder" },
  trainingDetail: { path: "/training/[id]", de: "Training bearbeiten", en: "Edit training" },
  trainingCombine: { path: "/training/[id]/combine", de: "Trainings kombinieren", en: "Combine training sessions" },
  trainingPrint: { path: "/training/[id]/print", de: "Training drucken", en: "Print training" },
  trainingPresent: { path: "/training/[id]/trainer", de: "Training durchführen", en: "Run training session" },
  quickCreate: { path: "/quick-create", de: "Quick Create", en: "Quick Create" },
  exercises: { path: "/exercises", de: "Übungsbibliothek", en: "Exercise library" },
  exerciseNew: { path: "/exercises/new", de: "Neue Übung", en: "New exercise" },
  exerciseDetail: { path: "/exercises/[id]", de: "Übungsdetails", en: "Exercise details" },
  exerciseEdit: { path: "/exercises/[id]/edit", de: "Übung bearbeiten", en: "Edit exercise" },
  aiDrafts: { path: "/exercises/ai-drafts", de: "AI-Übungsentwürfe", en: "AI exercise drafts" },
  games: { path: "/games", de: "Spiele", en: "Games" },
  gameNew: { path: "/games/new", de: "Neues Spiel", en: "New game" },
  obstacles: { path: "/obstacles", de: "Hindernisse", en: "Obstacles" },
  groups: { path: "/groups", de: "Vereinsgruppen", en: "Club groups" },
  safetyProfiles: { path: "/groups/safety-profiles", de: "Schutzprofile", en: "Safeguarding profiles" },
  media: { path: "/media", de: "Medien", en: "Media" },
  help: { path: "/help", de: "Hilfezentrum", en: "Help center" },
  admin: { path: "/admin", de: "Administration", en: "Administration" },
  outdoor: { path: "/admin/outdoor-variants", de: "Outdoor-Review", en: "Outdoor review" },
  userEdit: { path: "/admin/users/[id]/edit", de: "Benutzer bearbeiten", en: "Edit user" },
  login: { path: "/login", de: "Anmelden", en: "Sign in" },
  setup: { path: "/setup", de: "Erststart", en: "Initial setup" },
} as const;
export type RouteTitleKey = keyof typeof ROUTE_TITLES;

export function routeTitle(pathname: string, locale: Locale): string {
  const path = pathname.replace(/\/$/, "") || "/";
  const entries = Object.values(ROUTE_TITLES);
  const exact = entries.find((entry) => entry.path === path);
  const segments = path.split("/");
  const route = exact ?? entries.find((entry) => {
    const pattern = entry.path.split("/");
    return pattern.length === segments.length && pattern.every((segment, index) =>
      segment.startsWith("[") ? Boolean(segments[index]) : segment === segments[index]);
  });
  return route?.[locale] ?? "OCRCraft";
}

export function routeMetadata(key: RouteTitleKey): Metadata {
  return { title: { absolute: documentTitle(ROUTE_TITLES[key].path, "de") } };
}

export function documentTitle(pathname: string, locale: Locale): string {
  return `${routeTitle(pathname, locale)} · OCRCraft ${APP_VERSION}`;
}
