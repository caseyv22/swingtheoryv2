import { useState } from "react";
import {
  PageHead,
  Button,
  Field,
  Input,
  Textarea,
  Table,
  Th,
  Td,
  Badge,
  Drawer,
} from "@/components/admin/AdminUI";
import { ImageUploadField, type UploadStatus } from "@/components/admin/ImageUploadField";
import { useApi, invalidateCache } from "@/hooks/useApi";
import { useConfirm } from "@/hooks/useConfirm";
import { api } from "@/lib/admin-api";
import type { LeagueEventRow } from "@/data/types";

type FormState = Partial<LeagueEventRow>;

const empty: FormState = {
  title: "",
  subtitle: "",
  description: "",
  starts_at: "",
  ends_at: "",
  location_line: "",
  image_url: "",
  cta_label: "Sign up",
  cta_url: "/league#signup",
};

export default function AdminLeague() {
  const { data, loading, reload } = useApi<{ items: LeagueEventRow[] }>("/api/admin/league");
  const [drawer, setDrawer] = useState<{ open: boolean; form: FormState; id?: number }>({
    open: false,
    form: empty,
  });
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  function openNew() {
    setDrawer({ open: true, form: empty });
    setSaveError(null);
    setUploadStatus("idle");
  }
  function openEdit(row: LeagueEventRow) {
    setDrawer({ open: true, form: { ...row }, id: row.id });
    setSaveError(null);
    setUploadStatus("idle");
  }
  function close() {
    setDrawer({ open: false, form: empty });
  }

  async function save() {
    try {
      setSaveError(null);
      if (drawer.id) {
        await api.post(`/api/admin/league/${drawer.id}`, drawer.form);
      } else {
        await api.post(`/api/admin/league`, drawer.form);
      }
      invalidateCache("/api/admin/league");
      invalidateCache("/api/public/league-next");
      reload();
      close();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    }
  }

  const { confirm, dialog } = useConfirm();

  async function remove(id: number) {
    if (!(await confirm("Delete this league event?"))) return;
    await api.delete(`/api/admin/league/${id}`);
    invalidateCache("/api/admin/league");
    invalidateCache("/api/public/league-next");
    reload();
  }

  return (
    <>
      <PageHead
        title="League events"
        intro="Manage the next upcoming league event shown on /league."
        actions={<Button onClick={openNew}>+ New event</Button>}
      />
      {loading && <p className="text-muted">Loading…</p>}
      {data && (
        <Table>
          <thead>
            <tr>
              <Th>Title</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((row) => {
              const upcoming = new Date(row.starts_at) >= new Date();
              return (
                <tr key={row.id}>
                  <Td>
                    <div className="font-disp text-green-700">{row.title}</div>
                    {row.subtitle && <div className="text-muted text-xs">{row.subtitle}</div>}
                  </Td>
                  <Td>{new Date(row.starts_at).toLocaleString()}</Td>
                  <Td>
                    {upcoming ? <Badge tone="success">Upcoming</Badge> : <Badge>Past</Badge>}
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => openEdit(row)}>
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => remove(row.id)}>
                        Delete
                      </Button>
                    </div>
                  </Td>
                </tr>
              );
            })}
            {data.items.length === 0 && (
              <tr>
                <Td>
                  <div className="text-muted py-6">No league events yet.</div>
                </Td>
                <Td></Td>
                <Td></Td>
                <Td></Td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      <Drawer
        open={drawer.open}
        onClose={close}
        title={drawer.id ? "Edit event" : "New league event"}
      >
        <Field label="Title">
          <Input
            value={drawer.form.title ?? ""}
            onChange={(e) =>
              setDrawer((d) => ({ ...d, form: { ...d.form, title: e.target.value } }))
            }
          />
        </Field>
        <Field label="Subtitle (optional)">
          <Input
            value={drawer.form.subtitle ?? ""}
            onChange={(e) =>
              setDrawer((d) => ({ ...d, form: { ...d.form, subtitle: e.target.value } }))
            }
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={drawer.form.description ?? ""}
            onChange={(e) =>
              setDrawer((d) => ({ ...d, form: { ...d.form, description: e.target.value } }))
            }
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Starts at" hint="ISO datetime (e.g. 2026-08-14T19:00)">
            <Input
              type="datetime-local"
              value={drawer.form.starts_at ?? ""}
              onChange={(e) =>
                setDrawer((d) => ({ ...d, form: { ...d.form, starts_at: e.target.value } }))
              }
            />
          </Field>
          <Field label="Ends at (optional)">
            <Input
              type="datetime-local"
              value={drawer.form.ends_at ?? ""}
              onChange={(e) =>
                setDrawer((d) => ({ ...d, form: { ...d.form, ends_at: e.target.value } }))
              }
            />
          </Field>
        </div>
        <Field label="Location line (optional)">
          <Input
            value={drawer.form.location_line ?? ""}
            onChange={(e) =>
              setDrawer((d) => ({ ...d, form: { ...d.form, location_line: e.target.value } }))
            }
          />
        </Field>
        <Field label="Image">
          <ImageUploadField
            value={drawer.form.image_url ?? ""}
            onChange={(url) =>
              setDrawer((d) => ({ ...d, form: { ...d.form, image_url: url } }))
            }
            onStatusChange={setUploadStatus}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="CTA label">
            <Input
              value={drawer.form.cta_label ?? ""}
              onChange={(e) =>
                setDrawer((d) => ({ ...d, form: { ...d.form, cta_label: e.target.value } }))
              }
            />
          </Field>
          <Field label="CTA URL">
            <Input
              value={drawer.form.cta_url ?? ""}
              onChange={(e) =>
                setDrawer((d) => ({ ...d, form: { ...d.form, cta_url: e.target.value } }))
              }
            />
          </Field>
        </div>
        {saveError && (
          <div className="text-sm text-red-700 border border-red-200 bg-red-50 rounded-lg p-3">
            {saveError}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button onClick={save} disabled={uploadStatus === "uploading"}>
            {uploadStatus === "uploading" ? "Uploading image…" : drawer.id ? "Save" : "Create"}
          </Button>
        </div>
      </Drawer>
      {dialog}
    </>
  );
}
