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
import { useApi, invalidateCache } from "@/hooks/useApi";
import { useConfirm } from "@/hooks/useConfirm";
import { api } from "@/lib/admin-api";
import type { ProgramRow } from "@/data/types";

// Programs use JSON array for key_details. Edited as one-per-line textarea.
type FormState = {
  id?: number;
  slug: string;
  name: string;
  kicker: string;
  h1: string;
  short_desc: string;
  long_desc: string;
  audience: string;
  season: string;
  key_details_text: string; // one per line
  image_url: string;
  cta_label: string;
  cta_target: "interest" | "league";
  published: boolean;
  sort_order: number;
};

const empty: FormState = {
  slug: "",
  name: "",
  kicker: "",
  h1: "",
  short_desc: "",
  long_desc: "",
  audience: "",
  season: "",
  key_details_text: "",
  image_url: "",
  cta_label: "Request info",
  cta_target: "interest",
  published: true,
  sort_order: 100,
};

function toForm(row: ProgramRow): FormState {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    kicker: row.kicker,
    h1: row.h1,
    short_desc: row.short_desc,
    long_desc: row.long_desc,
    audience: row.audience,
    season: row.season,
    key_details_text: (row.key_details ?? []).join("\n"),
    image_url: row.image_url,
    cta_label: row.cta_label,
    cta_target: row.cta_target,
    published: true,
    sort_order: row.sort_order,
  };
}

function toPayload(f: FormState) {
  return {
    slug: f.slug,
    name: f.name,
    kicker: f.kicker,
    h1: f.h1,
    short_desc: f.short_desc,
    long_desc: f.long_desc,
    audience: f.audience,
    season: f.season,
    key_details: f.key_details_text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    image_url: f.image_url,
    cta_label: f.cta_label,
    cta_target: f.cta_target,
    published: f.published,
    sort_order: f.sort_order,
  };
}

export default function AdminPrograms() {
  const { data, loading, reload } = useApi<{ items: ProgramRow[] }>("/api/admin/programs");
  const [drawer, setDrawer] = useState<{ open: boolean; form: FormState }>({
    open: false,
    form: empty,
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function save() {
    try {
      setSaveError(null);
      const payload = toPayload(drawer.form);
      if (drawer.form.id) {
        await api.post(`/api/admin/programs/${drawer.form.id}`, payload);
      } else {
        await api.post(`/api/admin/programs`, payload);
      }
      invalidateCache("/api/admin/programs");
      invalidateCache("/api/public/programs");
      reload();
      setDrawer({ open: false, form: empty });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    }
  }

  const { confirm, dialog } = useConfirm();

  async function remove(id: number) {
    if (!(await confirm("Delete this program?"))) return;
    await api.delete(`/api/admin/programs/${id}`);
    invalidateCache("/api/admin/programs");
    invalidateCache("/api/public/programs");
    reload();
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const { url } = await api.upload(file);
      setDrawer((d) => ({ ...d, form: { ...d.form, image_url: url } }));
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <PageHead
        title="Programs"
        intro="Add, edit, or hide programs shown on /programs."
        actions={
          <Button
            onClick={() => {
              setSaveError(null);
              setDrawer({ open: true, form: empty });
            }}
          >
            + New program
          </Button>
        }
      />
      {loading && <p className="text-muted">Loading…</p>}
      {data && (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Slug</Th>
              <Th>Sort</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((row) => (
              <tr key={row.id}>
                <Td>
                  <div className="font-disp text-green-700">{row.name}</div>
                  {row.kicker && <div className="text-muted text-xs">{row.kicker}</div>}
                </Td>
                <Td className="font-mono text-xs">/programs/{row.slug}</Td>
                <Td>{row.sort_order}</Td>
                <Td>
                  <Badge tone="success">Published</Badge>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setDrawer({ open: true, form: toForm(row) })}
                    >
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => remove(row.id)}>
                      Delete
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Drawer
        open={drawer.open}
        onClose={() => setDrawer({ open: false, form: empty })}
        title={drawer.form.id ? `Edit ${drawer.form.name}` : "New program"}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Slug" hint="URL segment. Kebab-case.">
            <Input
              value={drawer.form.slug}
              onChange={(e) =>
                setDrawer((d) => ({ ...d, form: { ...d.form, slug: e.target.value } }))
              }
            />
          </Field>
          <Field label="Name">
            <Input
              value={drawer.form.name}
              onChange={(e) =>
                setDrawer((d) => ({ ...d, form: { ...d.form, name: e.target.value } }))
              }
            />
          </Field>
        </div>
        <Field label="Kicker" hint="Small label above the H1. E.g., 'Junior program'.">
          <Input
            value={drawer.form.kicker}
            onChange={(e) =>
              setDrawer((d) => ({ ...d, form: { ...d.form, kicker: e.target.value } }))
            }
          />
        </Field>
        <Field label="H1" hint="Money-phrase early. Include 'Pasadena' or similar geo.">
          <Input
            value={drawer.form.h1}
            onChange={(e) => setDrawer((d) => ({ ...d, form: { ...d.form, h1: e.target.value } }))}
          />
        </Field>
        <Field label="Short description" hint="First 40–60 words, shown as sub and meta.">
          <Textarea
            value={drawer.form.short_desc}
            onChange={(e) =>
              setDrawer((d) => ({ ...d, form: { ...d.form, short_desc: e.target.value } }))
            }
          />
        </Field>
        <Field label="Long description">
          <Textarea
            value={drawer.form.long_desc}
            rows={5}
            onChange={(e) =>
              setDrawer((d) => ({ ...d, form: { ...d.form, long_desc: e.target.value } }))
            }
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Audience">
            <Input
              value={drawer.form.audience}
              onChange={(e) =>
                setDrawer((d) => ({ ...d, form: { ...d.form, audience: e.target.value } }))
              }
            />
          </Field>
          <Field label="Season">
            <Input
              value={drawer.form.season}
              onChange={(e) =>
                setDrawer((d) => ({ ...d, form: { ...d.form, season: e.target.value } }))
              }
            />
          </Field>
        </div>
        <Field label="Key details" hint="One bullet per line.">
          <Textarea
            value={drawer.form.key_details_text}
            rows={6}
            onChange={(e) =>
              setDrawer((d) => ({ ...d, form: { ...d.form, key_details_text: e.target.value } }))
            }
          />
        </Field>
        <Field label="Image" hint="Uploads to R2.">
          <div className="space-y-2">
            {drawer.form.image_url && (
              <img
                src={drawer.form.image_url}
                alt=""
                className="max-h-40 rounded-lg border border-line"
              />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
            {uploading && <p className="text-muted text-sm">Uploading…</p>}
          </div>
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="CTA label">
            <Input
              value={drawer.form.cta_label}
              onChange={(e) =>
                setDrawer((d) => ({ ...d, form: { ...d.form, cta_label: e.target.value } }))
              }
            />
          </Field>
          <Field label="CTA target">
            <select
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-ink focus:outline-none focus:border-green-700"
              value={drawer.form.cta_target}
              onChange={(e) =>
                setDrawer((d) => ({
                  ...d,
                  form: { ...d.form, cta_target: e.target.value as "interest" | "league" },
                }))
              }
            >
              <option value="interest">Interest form</option>
              <option value="league">League signup</option>
            </select>
          </Field>
          <Field label="Sort order">
            <Input
              type="number"
              value={drawer.form.sort_order}
              onChange={(e) =>
                setDrawer((d) => ({
                  ...d,
                  form: { ...d.form, sort_order: Number(e.target.value) },
                }))
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
          <Button variant="ghost" onClick={() => setDrawer({ open: false, form: empty })}>
            Cancel
          </Button>
          <Button onClick={save}>{drawer.form.id ? "Save" : "Create"}</Button>
        </div>
      </Drawer>
      {dialog}
    </>
  );
}
