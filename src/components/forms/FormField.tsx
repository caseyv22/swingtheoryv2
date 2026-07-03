import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type BaseProps = {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  className?: string;
};

const inputBase =
  "w-full rounded-lg border border-line bg-white px-4 py-3 font-body text-ink " +
  "placeholder:text-muted/60 focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/20 " +
  "transition";

export function TextInput({
  label,
  name,
  error,
  required,
  className,
  ...props
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={name} className="font-disp font-semibold text-sm text-green-700">
        {label} {required && <span className="text-gold">*</span>}
      </label>
      <input id={name} name={name} className={inputBase} {...props} />
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function TextArea({
  label,
  name,
  error,
  required,
  className,
  ...props
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={name} className="font-disp font-semibold text-sm text-green-700">
        {label} {required && <span className="text-gold">*</span>}
      </label>
      <textarea id={name} name={name} className={cn(inputBase, "min-h-[120px]")} {...props} />
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function Select({
  label,
  name,
  error,
  required,
  className,
  children,
  ...props
}: BaseProps & InputHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={name} className="font-disp font-semibold text-sm text-green-700">
        {label} {required && <span className="text-gold">*</span>}
      </label>
      <select id={name} name={name} className={inputBase} {...(props as object)}>
        {children}
      </select>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function Honeypot() {
  return (
    <input
      type="text"
      name="honeypot"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}
    />
  );
}
