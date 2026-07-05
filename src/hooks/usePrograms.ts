import { useApi } from "./useApi";
import type { ProgramRow } from "@/data/types";
import { programs as staticPrograms, type Program } from "@/data/programs";

// Bridges the admin-editable /api/public/programs (D1-backed) with the
// static src/data/programs.ts file that the site shipped with. Same
// fallback pattern as Lessons.tsx uses for coaches: if the API has
// published rows, those win (so admin edits actually show up on the live
// site); otherwise we fall back to the static list so the site still
// works with an empty/unreachable database.
export type ProgramDisplay = Program & { useLeagueForm: boolean };

function adaptRow(r: ProgramRow): ProgramDisplay {
  return {
    slug: r.slug,
    name: r.name,
    h1: r.h1,
    kicker: r.kicker,
    shortDescription: r.short_desc,
    longDescription: r.long_desc,
    audience: r.audience,
    season: r.season || undefined,
    keyDetails: r.key_details,
    ctaLabel: r.cta_label,
    image: r.image_url,
    dateRange: r.date_range || undefined,
    timeRange: r.time_range || undefined,
    price: r.price || undefined,
    startsOn: r.starts_on || undefined,
    useLeagueForm: r.cta_target === "league",
  };
}

function adaptStatic(p: Program): ProgramDisplay {
  return { ...p, useLeagueForm: p.slug === "league-night" };
}

function fallbackList(): ProgramDisplay[] {
  return staticPrograms.map(adaptStatic);
}

// Full list, for the /programs index.
export function usePrograms(): { programs: ProgramDisplay[]; loading: boolean } {
  const { data, loading } = useApi<ProgramRow[]>("/api/public/programs");
  const list = data && data.length > 0 ? data.map(adaptRow) : fallbackList();
  return { programs: list, loading: loading && !data };
}

// Single program by slug, for detail pages. Works for the four
// originally-shipped programs AND any new program added later purely
// through the admin panel (see ProgramBySlug.tsx).
export function useProgram(slug: string): {
  program: ProgramDisplay | undefined;
  loading: boolean;
} {
  const { data, loading } = useApi<ProgramRow[]>("/api/public/programs");
  const list = data && data.length > 0 ? data.map(adaptRow) : fallbackList();
  return { program: list.find((p) => p.slug === slug), loading: loading && !data };
}
