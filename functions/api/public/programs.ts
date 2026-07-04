import { cachedJson, safeJsonArray } from "../../lib/http";
import type { Env } from "../../lib/db";

type Row = {
  id: number;
  slug: string;
  name: string;
  kicker: string;
  h1: string;
  short_desc: string;
  long_desc: string;
  audience: string;
  season: string;
  key_details: string;
  image_url: string;
  cta_label: string;
  cta_target: string;
  sort_order: number;
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results = [] } = await env.DB.prepare(
    `SELECT id, slug, name, kicker, h1, short_desc, long_desc, audience, season,
            key_details, image_url, cta_label, cta_target, sort_order
     FROM programs
     WHERE published = 1
     ORDER BY sort_order ASC, name ASC`,
  ).all<Row>();

  return cachedJson(
    results.map((r) => ({
      ...r,
      key_details: safeJsonArray(r.key_details),
    })),
    120, // 2 min edge cache
  );
};
