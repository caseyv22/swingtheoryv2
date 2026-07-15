import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// Tiny admin-only UI kit. Not intended for the public site.

export function PageHead({
  title,
  intro,
  actions,
}: {
  title: string;
  intro?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 mb-8 pb-6 border-b border-line">
      <div>
        <h1 className="font-disp text-3xl text-green-700">{title}</h1>
        {intro && <p className="text-muted mt-1">{intro}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white border border-line rounded-2xl p-6", className)}>{children}</div>
  );
}

export function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
  disabled,
  className,
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const v = {
    primary: "bg-green-700 text-white hover:bg-green-600",
    ghost: "border border-line text-green-700 hover:bg-cream",
    danger: "bg-red-600 text-white hover:bg-red-500",
  }[variant];
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "font-disp text-sm uppercase tracking-[0.05em] px-4 py-2 rounded-lg transition disabled:opacity-50",
        v,
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="font-disp text-xs uppercase tracking-[0.14em] text-green-700 mb-1">
        {label}
      </div>
      {children}
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
    </label>
  );
}

const inputBase =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-ink focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/20";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputBase, "min-h-[100px]", props.className)} />;
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "text-left font-disp text-[12px] uppercase tracking-[0.1em] text-muted px-4 py-3 border-b border-line",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 border-b border-line align-top", className)}>{children}</td>;
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warn" | "info";
}) {
  const t = {
    neutral: "bg-cream text-muted",
    success: "bg-green-700/10 text-green-700",
    warn: "bg-gold/20 text-gold-dk",
    info: "bg-blue-100 text-blue-800",
  }[tone];
  return (
    <span className={cn("inline-block text-[11px] font-disp uppercase tracking-[0.1em] px-2 py-1 rounded-full", t)}>
      {children}
    </span>
  );
}

/** In-app confirm dialog, replaces window.confirm() so the browser's
 *  native Safari/Chrome popup never shows up. Pair with useConfirm(). */
export function ConfirmDialog({
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-ink text-[0.98rem]">{message}</p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Basic modal / drawer wrapper. */
export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl h-full bg-cream shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-line flex items-center justify-between">
          <h2 className="font-disp text-xl text-green-700">{title}</h2>
          <button
            className="text-muted hover:text-ink text-2xl"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}
