import { useState, type FormEvent } from "react";
import {
  PageHead,
  Button,
  Table,
  Th,
  Td,
  Badge,
  Card,
  Field,
} from "@/components/admin/AdminUI";
import { useApi, invalidateCache } from "@/hooks/useApi";
import { useConfirm } from "@/hooks/useConfirm";
import { api } from "@/lib/admin-api";

type WaitlistRow = {
  id: number;
  parent_name: string;
  email: string;
  kid_name: string;
  kid_age: number;
  phone: string | null;
  created_at: string;
  position: number;
  status: string;
  subscription_id: string | null;
  activated_at: string | null;
  hasCard: boolean;
};

type WaitlistResponse = {
  items: WaitlistRow[];
  total: number;
  capacity: number;
  remaining: number;
  isFull: boolean;
};

// Manages the Mini Mulligans early-access waitlist. Public /api/mm-waitlist
// handles self-serve signups (with the 18-cap enforced); this page lets an
// admin see the ordered list, manually add someone who signed up offline,
// or remove someone who dropped. Deletion frees up their slot so the next
// public POST succeeds.
export default function AdminMMWaitlist() {
  const { data, loading, reload } = useApi<WaitlistResponse>(
    "/api/admin/mm-waitlist",
  );
  const { confirm, dialog } = useConfirm();
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<number | null>(null);

  // Activate a reserved parent on the $400/mo plan. This creates the Square
  // subscription and charges the card on file NOW, so it's gated behind an
  // explicit confirm that spells out the charge.
  async function activateRow(row: WaitlistRow) {
    setActionError(null);
    if (
      !(await confirm(
        `Activate ${row.parent_name} (${row.kid_name}) on the $400/month plan? This creates the Square subscription and charges their card on file $400 now.`,
      ))
    )
      return;
    setActivatingId(row.id);
    try {
      await api.post(`/api/admin/mm-waitlist/${row.id}`, {});
      invalidateCache("/api/admin/mm-waitlist");
      reload();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? `Couldn't activate ${row.parent_name}: ${err.message}`
          : "Activation failed.",
      );
    } finally {
      setActivatingId(null);
    }
  }

  async function removeRow(row: WaitlistRow) {
    if (
      !(await confirm(
        `Remove ${row.parent_name} (${row.kid_name}, age ${row.kid_age}) from the waitlist? This frees their slot.`,
      ))
    )
      return;
    await api.delete(`/api/admin/mm-waitlist/${row.id}`);
    invalidateCache("/api/admin/mm-waitlist");
    reload();
  }

  async function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddError(null);
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      await api.post("/api/admin/mm-waitlist", {
        parent_name: String(form.get("parent_name") ?? "").trim(),
        email: String(form.get("email") ?? "").trim(),
        kid_name: String(form.get("kid_name") ?? "").trim(),
        kid_age: String(form.get("kid_age") ?? "").trim(),
        phone: String(form.get("phone") ?? "").trim(),
      });
      invalidateCache("/api/admin/mm-waitlist");
      reload();
      setAdding(false);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Could not add.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHead
        title="Mini Mulligans waitlist"
        intro={
          data
            ? `${data.total} of ${data.capacity} early-access spots filled${
                data.isFull ? " — waitlist is full" : `, ${data.remaining} open`
              }.`
            : "Loading…"
        }
        actions={
          <Button
            variant={adding ? "ghost" : "primary"}
            onClick={() => {
              setAdding((v) => !v);
              setAddError(null);
            }}
          >
            {adding ? "Cancel" : "Add entry"}
          </Button>
        }
      />

      {adding && (
        <Card className="mb-6">
          <form onSubmit={onAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Parent name">
              <input
                name="parent_name"
                required
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-ink"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                name="email"
                required
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-ink"
              />
            </Field>
            <Field label="Child's name">
              <input
                name="kid_name"
                required
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-ink"
              />
            </Field>
            <Field label="Child's age">
              <input
                type="number"
                name="kid_age"
                min={3}
                max={18}
                required
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-ink"
              />
            </Field>
            <Field label="Phone (optional)">
              <input
                type="tel"
                name="phone"
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-ink"
              />
            </Field>
            <div className="md:col-span-2 flex items-center justify-between gap-4">
              {addError ? (
                <div className="text-sm text-red-700">{addError}</div>
              ) : (
                <div className="text-xs text-muted">
                  Adds directly to the list — no confirmation email is sent to the parent.
                </div>
              )}
              <Button type="submit" disabled={submitting}>
                {submitting ? "Adding…" : "Add to waitlist"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {actionError && (
        <div className="mb-4 text-sm text-red-700 border border-red-200 bg-red-50 rounded-lg p-3">
          {actionError}
        </div>
      )}

      {loading && <p className="text-muted">Loading…</p>}
      {data && (
        <Table>
          <thead>
            <tr>
              <Th>Position</Th>
              <Th>Parent</Th>
              <Th>Child</Th>
              <Th>Contact</Th>
              <Th>Status</Th>
              <Th>Signed up</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((row) => (
              <tr key={row.id}>
                <Td>
                  <Badge tone={row.position <= data.capacity ? "info" : "warn"}>
                    #{row.position} / {data.capacity}
                  </Badge>
                </Td>
                <Td className="font-disp">{row.parent_name}</Td>
                <Td>
                  <div className="text-ink">{row.kid_name}</div>
                  <div className="text-muted text-xs">age {row.kid_age}</div>
                </Td>
                <Td>
                  <div className="text-ink">{row.email}</div>
                  {row.phone && <div className="text-muted text-xs">{row.phone}</div>}
                </Td>
                <Td>
                  {row.status === "activated" ? (
                    <Badge tone="success">Activated</Badge>
                  ) : (
                    <Badge tone={row.hasCard ? "info" : "warn"}>
                      {row.hasCard ? "Reserved" : "No card"}
                    </Badge>
                  )}
                </Td>
                <Td className="text-xs text-muted whitespace-nowrap">{row.created_at}</Td>
                <Td>
                  <div className="flex items-center gap-2 justify-end">
                    {row.status !== "activated" && row.hasCard && (
                      <Button
                        onClick={() => activateRow(row)}
                        disabled={activatingId === row.id}
                      >
                        {activatingId === row.id ? "Activating…" : "Activate $400/mo"}
                      </Button>
                    )}
                    <Button variant="danger" onClick={() => removeRow(row)}>
                      Remove
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <Td className="text-muted py-8">
                  Nobody on the waitlist yet.
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
      {dialog}
    </>
  );
}
