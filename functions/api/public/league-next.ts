import { cachedJson } from "../../lib/http";
import type { Env } from "../../lib/db";

type Row = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  starts_at: string;
  ends_at: string;
  location_line: string;
  image_url: string;
  cta_label: string;
  cta_url: string;
};

// Returns the next upcoming league event (or null if none scheduled).
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const now = new Date().toISOString();
  const row = await env.DB.prepare(
    `SELECT id, title, subtitle, description, starts_at, ends_at,
            location_line, image_url, cta_label, cta_url
     FROM league_events
     WHERE published = 1 AND starts_at >= ?
     ORDER BY starts_at ASC
     LIMIT 1`,
  )
    .bind(now)
    .first<Row>();

  return cachedJson(row ?? null, 60);
};
