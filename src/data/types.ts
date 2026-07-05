// Shared types matching the D1 → JSON API shape.

export type ProgramRow = {
  id: number;
  slug: string;
  name: string;
  kicker: string;
  h1: string;
  short_desc: string;
  long_desc: string;
  audience: string;
  season: string;
  key_details: string[];
  image_url: string;
  cta_label: string;
  cta_target: "interest" | "league";
  sort_order: number;
  date_range: string;
  time_range: string;
  price: string;
  starts_on: string;
};

export type CoachRow = {
  id: number;
  slug: string;
  name: string;
  title: string;
  bio: string;
  photo_url: string;
  specialties: string[];
  phone: string;
  email: string;
  sort_order: number;
};

export type LeagueEventRow = {
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

export type SubmissionRow = {
  id: number;
  form_type: "contact" | "event" | "league" | "membership" | "program";
  program: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  payload_json: string;
  user_ip: string;
  user_agent: string;
  status: "new" | "read" | "archived";
  created_at: string;
};
