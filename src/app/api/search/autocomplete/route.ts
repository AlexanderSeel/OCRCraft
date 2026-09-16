import { NextRequest, NextResponse } from "next/server";
import { autocompleteExercises } from "@/server/search/autocomplete-service";
import type { SearchLocale } from "@/server/search/search-index-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const requestedLocale = request.nextUrl.searchParams.get("locale");
  const locale: SearchLocale = requestedLocale === "en" ? "en" : "de";
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? 10);
  const limit = Number.isFinite(requestedLimit) ? requestedLimit : 10;

  const items = await autocompleteExercises(query, locale, limit);
  return NextResponse.json({ query, locale, items });
}
