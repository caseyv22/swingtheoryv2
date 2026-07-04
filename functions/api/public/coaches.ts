import { cachedJson, safeJsonArray } from "../../lib/http";
import type { Env } from "../../lib/db";

type Row = {
  id: number;
  slug: string;
  name: string;
  title: string;
  bio: string;
  photo_url: string;
  specialties: string;
  phone: string;
  email: string;
  sort_order: number;
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results = [] } = await env.DB.prepare(
    `SELECT id, slug, name, title, bio, photo_url, specialties, phone, email, sort_order
     FROM coaches
     WHERE published = 1
     ORDER BY sort_order ASC, name ASC`,
  ).all<Row>();

  return cachedJson(
    results.map((r) => ({
      ...r,
      specialties: safeJsonArray(r.specialties),
    })),
    120,
  );
};
