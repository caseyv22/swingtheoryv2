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
import type { CoachRow } from "@/data/types";

type FormState = {
  id?: number;
  slug: string;
  name: string;
  title: string;
  bio: string;
  photo_url: string;
  specialties_text: string;
  phone: string;
  email: string;
  sort_order: number;
};

const empty: FormState = {
  slug: "",
  name: "",
  title: "",
  bio: "",
  photo_url: "",
  specialties_text: "",
  phone: "",
  email: "",
  sort_order: 100,
};

function toForm(c: CoachRow): FormState {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    title: c.title,
    bio: c.bio,
    photo_url: c.photo_url,
    specialties_text: (c.specialties ?? []).join(", "),
    phone: c.phone,
    email: c.email,
    sort_order: c.sort_order,
  };
}

function toPayload(f: FormState) {
  return {
    slug: f.slug,
    name: f.name,
    title: f.title,
    bio: f.bio,
    photo_url: f.photo_url,
    specialties: f.specialties_text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    phone: f.phone,
    email: f.email,
    sort_order: f.sort_order,
  };
}

export default function AdminCoaches() {
  const { data, loading, reload } = useApi<{ items: CoachRow[] }>("/api/admin/coaches");
  const [drawer, setDrawer] = useState<{ open: boolean; form: FormState }>({
    open: false,
    form: empty,
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");

  async function save() {
    try {
      setSaveError(null);
      const payload = toPayload(drawer.form);
      if (drawer.form.id) {
        await api.post(`/api/admin/coaches/${drawer.form.id}`, payload);
      } else {
        await api.post(`/api/admin/coaches`, payload);
      }
      invalidateCache("/api/admin/coaches");
      invalidateCache("/api/public/coaches");
      reload();
      setDrawer({ open: false, form: empty });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    }
  }

  const { confirm, dialog } = useConfirm();

  async function remove(id: number) {
    if (!(await confirm("Delete this coach profile?"))) return;
    await api.delete(`/api/admin/coaches/${id}`);
    invalidateCache("/api/admin/coaches");
    invalidateCache("/api/public/coaches");
    reload();
  }

  return (
    <>
      <PageHead
        title="Lessons, Coaches"
        intro="Add, edit, or remove coach profiles shown on /lessons."
        actions={
          <Button
            onClick={() => {
              setSaveError(null);
              setUploadStatus("idle");
              setDrawer({ open: true, form: empty });
            }}
          >
            + New coach
          </Button>
        }
      />
      {loading && <p className="text-muted">Loading…</p>}
      {data && (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Title</Th>
              <Th>Phone</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((row) => (
              <tr key={row.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    {row.photo_url && (
                      <img
                        src={row.photo_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div className="font-disp text-green-700">{row.name}</div>
                  </div>
                </Td>
                <Td>{row.title}</Td>
                <Td>{row.phone}</Td>
                <Td>
                  <Badge tone="success">Published</Badge>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSaveError(null);
                        setUploadStatus("idle");
                        setDrawer({ open: true, form: toForm(row) });
                      }}
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
        title={drawer.form.id ? `Edit ${drawer.form.name}` : "New coach"}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Slug">
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
        <Field label="Title" hint="E.g., 'PGA Professional Instructor'.">
          <Input
            value={drawer.form.title}
            onChange={(e) =>
              setDrawer((d) => ({ ...d, form: { ...d.form, title: e.target.value } }))
            }
          />
        </Field>
        <Field label="Bio">
          <Textarea
            value={drawer.form.bio}
            rows={5}
            onChange={(e) =>
              setDrawer((d) => ({ ...d, form: { ...d.form, bio: e.target.value } }))
            }
          />
        </Field>
        <Field label="Headshot">
          <ImageUploadField
            value={drawer.form.photo_url}
            onChange={(url) =>
              setDrawer((d) => ({ ...d, form: { ...d.form, photo_url: url } }))
            }
            onStatusChange={setUploadStatus}
          />
        </Field>
        <Field
          label="Experience"
          hint="Comma-separated. Shows as a checklist on the coach's card, e.g. '20+ Years of teaching, PGA Tour player Adviser since 2013'."
        >
          <Input
            value={drawer.form.specialties_text}
            onChange={(e) =>
              setDrawer((d) => ({
                ...d,
                form: { ...d.form, specialties_text: e.target.value },
              }))
            }
          />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Phone" hint="Shown as a call button on the card.">
            <Input
              value={drawer.form.phone}
              onChange={(e) =>
                setDrawer((d) => ({ ...d, form: { ...d.form, phone: e.target.value } }))
              }
            />
          </Field>
          <Field label="Email">
            <Input
              value={drawer.form.email}
              onChange={(e) =>
                setDrawer((d) => ({ ...d, form: { ...d.form, email: e.target.value } }))
              }
            />
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
          <Button onClick={save} disabled={uploadStatus === "uploading"}>
            {uploadStatus === "uploading"
              ? "Uploading photo…"
              : drawer.form.id
                ? "Save"
                : "Create"}
          </Button>
        </div>
      </Drawer>
      {dialog}
    </>
  );
}
