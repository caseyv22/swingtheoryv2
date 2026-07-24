import { useState } from "react";
import { PageHead, Card, Table, Th, Td } from "@/components/admin/AdminUI";
import { useApi } from "@/hooks/useApi";

type Range = "7d" | "30d" | "90d" | "all";

type SummaryResponse = {
  range: Range;
  current: {
    pageviews: number;
    sessions: number;
    visitors: number;
    bounce_rate: number;
  };
  previous: SummaryResponse["current"];
  deltas: {
    pageviews: number | null;
    sessions: number | null;
    visitors: number | null;
    bounce_rate: number | null;
  };
};

type PagesResponse = {
  range: Range;
  items: Array<{ path: string; pageviews: number }>;
};

type ReferrersResponse = {
  range: Range;
  items: Array<{ host: string; pageviews: number }>;
};

type EventsResponse = {
  range: Range;
  items: Array<{
    label: string;
    clicks: number;
    sessions: number;
    delta: number | null;
  }>;
};

// Human labels for the known event labels — the backend stores machine
// names ("book_a_bay", "coach_phone_jae-lee"); we display something
// readable. Coach labels fall through to a generic "Coach: <slug>"
// display so admin never sees a raw `coach_phone_x` string.
function humanLabel(machine: string): string {
  if (machine === "book_a_bay") return "Book a Bay";
  if (machine.startsWith("coach_phone_")) {
    const slug = machine.slice("coach_phone_".length);
    const name = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return `Coach phone: ${name}`;
  }
  return machine;
}

const RANGE_LABEL: Record<Range, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

// Human-friendly formatters. Locale-string for thousands separators,
// one-decimal percent for bounce rate, signed delta with color coded to
// intent (pageviews/sessions/visitors: up=good; bounce rate: down=good).
const fmtInt = (n: number) => n.toLocaleString("en-US");
const fmtPct = (n: number) => (n * 100).toFixed(1) + "%";

function DeltaChip({ delta, inverse }: { delta: number | null; inverse?: boolean }) {
  if (delta === null) {
    return <span className="text-muted text-xs font-medium">—</span>;
  }
  // inverse=true means a positive delta is bad (bounce rate goes up = worse).
  const isPositive = delta > 0;
  const isGood = inverse ? !isPositive : isPositive;
  const color =
    delta === 0
      ? "text-muted"
      : isGood
      ? "text-green-700"
      : "text-red-600";
  const sign = delta > 0 ? "+" : "";
  return <span className={`${color} text-xs font-semibold`}>{sign}{delta.toFixed(1)}%</span>;
}

// Section-title styling used by the three cards. Small caps kicker matches
// the rest of the admin pages so the analytics dashboard doesn't look
// bolted on.
function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-disp text-[11px] tracking-[0.14em] uppercase text-green-700 mb-3">
      {children}
    </div>
  );
}

export default function AdminAnalytics() {
  const [range, setRange] = useState<Range>("7d");

  const { data: summary, loading: sLoading } = useApi<SummaryResponse>(
    `/api/admin/analytics?view=summary&range=${range}`,
  );
  const { data: pages, loading: pLoading } = useApi<PagesResponse>(
    `/api/admin/analytics?view=pages&range=${range}&limit=20`,
  );
  const { data: referrers, loading: rLoading } = useApi<ReferrersResponse>(
    `/api/admin/analytics?view=referrers&range=${range}&limit=20`,
  );
  const { data: events, loading: eLoading } = useApi<EventsResponse>(
    `/api/admin/analytics?view=events&range=${range}&limit=20`,
  );

  return (
    <>
      <PageHead
        title="Analytics"
        intro="First-party pageview data. Beacon fires on every route change and lands in D1."
        actions={
          <select
            className="rounded-lg border border-line bg-white px-3 py-2 text-ink font-disp text-sm"
            value={range}
            onChange={(e) => setRange(e.target.value as Range)}
          >
            {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
              <option key={r} value={r}>
                {RANGE_LABEL[r]}
              </option>
            ))}
          </select>
        }
      />

      {/* Compare card — matches the Burst Statistics weekly-email layout
          Casey shared as reference: 4 metrics with vs-previous-period
          deltas. */}
      <Card className="mb-6">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="font-disp text-xl text-green-700">Compare</h2>
            <div className="text-muted text-sm">
              {range === "all" ? "All time (no previous period)" : "vs. previous period"}
            </div>
          </div>
        </div>
        {sLoading && <p className="text-muted">Loading…</p>}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCell
              label="Pageviews"
              value={fmtInt(summary.current.pageviews)}
              delta={<DeltaChip delta={summary.deltas.pageviews} />}
            />
            <MetricCell
              label="Sessions"
              value={fmtInt(summary.current.sessions)}
              delta={<DeltaChip delta={summary.deltas.sessions} />}
            />
            <MetricCell
              label="Visitors"
              value={fmtInt(summary.current.visitors)}
              delta={<DeltaChip delta={summary.deltas.visitors} />}
            />
            <MetricCell
              label="Bounce rate"
              value={fmtPct(summary.current.bounce_rate)}
              delta={<DeltaChip delta={summary.deltas.bounce_rate} inverse />}
            />
          </div>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <Kicker>Most visited pages</Kicker>
          {pLoading && <p className="text-muted">Loading…</p>}
          {pages && pages.items.length === 0 && (
            <p className="text-muted text-sm">No pageviews in this range yet.</p>
          )}
          {pages && pages.items.length > 0 && (
            <Table>
              <thead>
                <tr>
                  <Th>Page</Th>
                  <Th className="text-right">Pageviews</Th>
                </tr>
              </thead>
              <tbody>
                {pages.items.map((row) => (
                  <tr key={row.path}>
                    <Td className="font-mono text-sm">{row.path}</Td>
                    <Td className="text-right font-disp">{fmtInt(row.pageviews)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <Kicker>Top referrers</Kicker>
          {rLoading && <p className="text-muted">Loading…</p>}
          {referrers && referrers.items.length === 0 && (
            <p className="text-muted text-sm">No external referrers yet.</p>
          )}
          {referrers && referrers.items.length > 0 && (
            <Table>
              <thead>
                <tr>
                  <Th>Referrer</Th>
                  <Th className="text-right">Pageviews</Th>
                </tr>
              </thead>
              <tbody>
                {referrers.items.map((row) => (
                  <tr key={row.host}>
                    <Td>
                      <a
                        href={`https://${row.host}`}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-green-700 hover:underline"
                      >
                        {row.host}
                      </a>
                    </Td>
                    <Td className="text-right font-disp">{fmtInt(row.pageviews)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      {/* Click events — Book a Bay + per-coach phone taps. Sessions
          column is unique-sessions-that-fired-the-click (rough conversion
          proxy: sessions with click / total sessions). Delta compares to
          the same-length previous period; null → no data to compare. */}
      <Card className="mt-6">
        <Kicker>Click events</Kicker>
        {eLoading && <p className="text-muted">Loading…</p>}
        {events && events.items.length === 0 && (
          <p className="text-muted text-sm">
            No click events tracked in this range yet. Book-a-Bay buttons and
            coach phone taps report to <code className="text-xs">/api/e</code>.
          </p>
        )}
        {events && events.items.length > 0 && (
          <Table>
            <thead>
              <tr>
                <Th>Event</Th>
                <Th className="text-right">Clicks</Th>
                <Th className="text-right">Sessions</Th>
                <Th className="text-right">vs. prev</Th>
              </tr>
            </thead>
            <tbody>
              {events.items.map((row) => (
                <tr key={row.label}>
                  <Td>{humanLabel(row.label)}</Td>
                  <Td className="text-right font-disp">{fmtInt(row.clicks)}</Td>
                  <Td className="text-right text-muted">{fmtInt(row.sessions)}</Td>
                  <Td className="text-right">
                    <DeltaChip delta={row.delta} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}

function MetricCell({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-cream/50 p-4">
      <div className="text-muted text-[11px] font-disp font-semibold tracking-[0.12em] uppercase">
        {label}
      </div>
      <div className="font-disp text-3xl text-green-700 mt-1 leading-none">{value}</div>
      <div className="mt-2">{delta}</div>
    </div>
  );
}
