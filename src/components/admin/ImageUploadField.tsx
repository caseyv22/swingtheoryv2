import { useState } from "react";
import { api } from "@/lib/admin-api";

export type UploadStatus = "idle" | "uploading" | "ok" | "error";

// Shared upload widget for admin image fields (coaches, programs, league
// events). Fixes two things Casey flagged:
// 1. The Save button could be clicked while an upload was still in
//    flight, now the parent can disable Save via onStatusChange.
// 2. A successful upload response doesn't guarantee the URL actually
//    serves an image back (e.g. if the R2 bucket's public custom domain
//    isn't connected yet). This renders the preview with onLoad/onError
//    so success or failure is visible immediately, instead of a silently
//    blank preview.
export function ImageUploadField({
  value,
  onChange,
  onStatusChange,
  hint = "Uploads to R2. JPEG / PNG / WebP, up to 10 MB.",
}: {
  value: string;
  onChange: (url: string) => void;
  onStatusChange?: (status: UploadStatus) => void;
  hint?: string;
}) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  function report(s: UploadStatus) {
    setStatus(s);
    onStatusChange?.(s);
  }

  async function handleUpload(file: File) {
    setError(null);
    report("uploading");
    try {
      const { url } = await api.upload(file);
      onChange(url);
      // Status stays "uploading" until the <img> below actually confirms
      // the URL loads (onLoad/onError), not just until the upload POST
      // returns, that's the real "did it work" signal.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      report("error");
    }
  }

  return (
    <div className="space-y-2">
      {value && (
        <div className="flex items-center gap-3 flex-wrap">
          <img
            key={value}
            src={value}
            alt=""
            className="max-h-40 rounded-lg border border-line"
            onLoad={() => report("ok")}
            onError={() => {
              setError(
                "Uploaded, but this URL isn't loading back as an image. The R2 bucket's public domain may not be connected yet, ask Claude to check Cloudflare R2 settings for the custom domain.",
              );
              report("error");
            }}
          />
          {status === "ok" && (
            <span className="text-green-700 text-sm font-disp">✓ Image confirmed</span>
          )}
        </div>
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={status === "uploading"}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUpload(f);
        }}
        className="block text-sm"
      />
      {status === "uploading" && <p className="text-muted text-sm">Uploading…</p>}
      {hint && status === "idle" && !value && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p className="text-sm text-red-700 border border-red-200 bg-red-50 rounded-lg p-3">
          {error}
        </p>
      )}
    </div>
  );
}
