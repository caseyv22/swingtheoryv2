import { json } from "../../lib/http";
import { requireAdmin } from "../../lib/access";
import type { Env } from "../../lib/db";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// POST multipart/form-data with `file` field.
// Returns { url } for the uploaded object.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return json({ error: "file field required" }, 400);
  if (file.size > MAX_BYTES) return json({ error: "File too large (10 MB max)" }, 413);
  if (!ALLOWED.has(file.type)) return json({ error: `Unsupported type: ${file.type}` }, 415);

  const ext = extensionFor(file.type);
  const key = `uploads/${Date.now()}-${slug(file.name)}${ext}`;

  await env.MEDIA.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      uploadedBy: user.email,
      originalName: file.name,
    },
  });

  const url = `${env.MEDIA_PUBLIC_BASE.replace(/\/$/, "")}/${key}`;
  return json({ url, key });
};

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function extensionFor(mime: string): string {
  return (
    {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
    }[mime] ?? ""
  );
}
