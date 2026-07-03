import { Link } from "react-router-dom";
import { PageHead, Card } from "@/components/admin/AdminUI";
import { useApi } from "@/hooks/useApi";
import type { SubmissionRow, ProgramRow, CoachRow, LeagueEventRow } from "@/data/types";

export default function Dashboard() {
  const subs = useApi<{ items: SubmissionRow[]; total: number }>("/api/admin/submissions?limit=5");
  const progs = useApi<{ items: ProgramRow[] }>("/api/admin/programs");
  const coaches = useApi<{ items: CoachRow[] }>("/api/admin/coaches");
  const league = useApi<{ items: LeagueEventRow[] }>("/api/admin/league");

  return (
    <>
      <PageHead title="Dashboard" intro="Quick pulse across the site." />
      <div className="grid gap-6 md:grid-cols-4">
        <Stat label="Submissions" value={subs.data?.total ?? "…"} to="/admin/submissions" />
        <Stat label="Programs" value={progs.data?.items?.length ?? "…"} to="/admin/programs" />
        <Stat label="Coaches" value={coaches.data?.items?.length ?? "…"} to="/admin/coaches" />
        <Stat label="League events" value={league.data?.items?.length ?? "…"} to="/admin/league" />
      </div>

      <div className="mt-10">
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="font-disp text-xl text-green-700">Latest submissions</h2>
          <Link to="/admin/submissions" className="font-disp text-sm text-gold-dk hover:underline">
            View all →
          </Link>
        </div>
        <Card>
          {subs.data?.items?.length ? (
            <ul className="divide-y divide-line">
              {subs.data.items.map((s) => (
                <li key={s.id} className="py-3 flex justify-between gap-4">
                  <div>
                    <div className="font-disp text-sm text-green-700 uppercase tracking-[0.1em]">
                      {s.form_type}
                    </div>
                    <div className="text-ink">{s.name} · {s.email}</div>
                    {s.message && <div className="text-muted text-sm mt-1 line-clamp-1">{s.message}</div>}
                  </div>
                  <div className="text-xs text-muted whitespace-nowrap">{s.created_at}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No submissions yet.</p>
          )}
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value, to }: { label: string; value: number | string; to: string }) {
  return (
    <Link to={to} className="block">
      <Card className="hover:border-gold transition">
        <div className="font-disp text-xs uppercase tracking-[0.14em] text-muted">{label}</div>
        <div className="font-disp text-4xl text-green-700 mt-2">{value}</div>
      </Card>
    </Link>
  );
}
