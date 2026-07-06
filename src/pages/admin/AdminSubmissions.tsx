import { useState } from "react";
import {
  PageHead,
  Button,
  Table,
  Th,
  Td,
  Badge,
  Drawer,
  Field,
} from "@/components/admin/AdminUI";
import { useApi, invalidateCache } from "@/hooks/useApi";
import { useConfirm } from "@/hooks/useConfirm";
import { api } from "@/lib/admin-api";
import type { SubmissionRow } from "@/data/types";

const FORM_TYPES = [
  "contact",
  "event",
  "league",
  "interest",
  "membership-checkout",
  "program-checkout",
] as const;
const STATUSES = ["new", "read", "archived"] as const;

export default function AdminSubmissions() {
  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [view, setView] = useState<SubmissionRow | null>(null);

  const qs = new URLSearchParams();
  if (type) qs.set("type", type);
  if (status) qs.set("status", status);
  qs.set("limit", "200");
  const { data, loading, reload } = useApi<{
    items: SubmissionRow[];
    total: number;
  }>(`/api/admin/submissions?${qs.toString()}`);

  const exportUrl = `/api/admin/submissions/export?${qs.toString()}`;

  async function updateStatus(id: number, newStatus: string) {
    await api.post(`/api/admin/submissions/${id}`, { status: newStatus });
    invalidateCache("/api/admin/submissions");
    reload();
  }

  const { confirm, dialog } = useConfirm();

  async function remove(id: number) {
    if (!(await confirm("Delete this submission?"))) return;
    await api.delete(`/api/admin/submissions/${id}`);
    invalidateCache("/api/admin/submissions");
    reload();
    setView(null);
  }

  return (
    <>
      <PageHead
        title="Submissions"
        intro={`${data?.total ?? "…"} total. Emails still land in info@swingtheory.golf.`}
        actions={
          <a href={exportUrl} className="font-disp text-sm uppercase tracking-[0.05em] px-4 py-2 rounded-lg border border-line text-green-700 hover:bg-cream">
            Export CSV
          </a>
        }
      />
      <div className="flex gap-3 mb-6">
        <select
          className="rounded-lg border border-line bg-white px-3 py-2 text-ink"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">All types</option>
          {FORM_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-line bg-white px-3 py-2 text-ink"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-muted">Loading…</p>}
      {data && (
        <Table>
          <thead>
            <tr>
              <Th>Type</Th>
              <Th>Name</Th>
              <Th>Contact</Th>
              <Th>Message</Th>
              <Th>Status</Th>
              <Th>When</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((row) => (
              <tr key={row.id}>
                <Td>
                  <Badge tone="info">{row.form_type}</Badge>
                  {row.program && (
                    <div className="text-muted text-xs mt-1">{row.program}</div>
                  )}
                </Td>
                <Td className="font-disp">{row.name}</Td>
                <Td>
                  <div className="text-ink">{row.email}</div>
                  {row.phone && <div className="text-muted text-xs">{row.phone}</div>}
                </Td>
                <Td className="max-w-md">
                  <div className="line-clamp-2 text-sm">{row.message}</div>
                </Td>
                <Td>
                  {row.status === "new" && <Badge tone="warn">new</Badge>}
                  {row.status === "read" && <Badge>read</Badge>}
                  {row.status === "archived" && <Badge>archived</Badge>}
                </Td>
                <Td className="text-xs text-muted whitespace-nowrap">{row.created_at}</Td>
                <Td>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setView(row);
                      if (row.status === "new") updateStatus(row.id, "read");
                    }}
                  >
                    View
                  </Button>
                </Td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <Td>
                  <div className="text-muted py-8">No submissions match these filters.</div>
                </Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      <Drawer
        open={!!view}
        onClose={() => setView(null)}
        title={view ? `${view.form_type} submission #${view.id}` : ""}
      >
        {view && (
          <>
            <Field label="Name">
              <div className="text-ink">{view.name}</div>
            </Field>
            <Field label="Email">
              <a href={`mailto:${view.email}`} className="text-green-700 hover:underline">
                {view.email}
              </a>
            </Field>
            <Field label="Phone">
              <div className="text-ink">{view.phone || "N/A"}</div>
            </Field>
            {view.program && (
              <Field label="Program">
                <div className="text-ink">{view.program}</div>
              </Field>
            )}
            <Field label="Message">
              <div className="whitespace-pre-line text-ink">{view.message || "N/A"}</div>
            </Field>
            <Field label="Full payload">
              <pre className="text-xs bg-cream rounded-lg p-3 overflow-x-auto border border-line">
                {JSON.stringify(safeParse(view.payload_json), null, 2)}
              </pre>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Submitted">
                <div className="text-ink text-sm">{view.created_at}</div>
              </Field>
              <Field label="IP">
                <div className="text-muted text-xs font-mono">{view.user_ip || "N/A"}</div>
              </Field>
            </div>
            <div className="flex flex-wrap justify-between gap-2 pt-4">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    updateStatus(view.id, "read");
                    setView({ ...view, status: "read" });
                  }}
                >
                  Mark read
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    updateStatus(view.id, "archived");
                    setView({ ...view, status: "archived" });
                  }}
                >
                  Archive
                </Button>
              </div>
              <Button variant="danger" onClick={() => remove(view.id)}>
                Delete
              </Button>
            </div>
          </>
        )}
      </Drawer>
      {dialog}
    </>
  );
}

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
