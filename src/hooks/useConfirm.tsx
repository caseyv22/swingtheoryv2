import { useCallback, useState } from "react";
import { ConfirmDialog } from "@/components/admin/AdminUI";

// Promise-based replacement for window.confirm(). Native confirm()/alert()
// render as a Safari/Chrome chrome-level popup outside the page's control
// (can't be styled, blocks the whole tab, looks broken embedded in an
// iframe preview). This renders an in-app modal instead:
//
//   const { confirm, dialog } = useConfirm();
//   if (!(await confirm("Delete this program?"))) return;
//   ...
//   return <>{dialog}{/* rest of page */}</>;
export function useConfirm() {
  const [pending, setPending] = useState<{
    message: string;
    confirmLabel?: string;
    resolve: (v: boolean) => void;
  } | null>(null);

  const confirm = useCallback((message: string, confirmLabel?: string) => {
    return new Promise<boolean>((resolve) => {
      setPending({ message, confirmLabel, resolve });
    });
  }, []);

  const dialog = pending ? (
    <ConfirmDialog
      message={pending.message}
      confirmLabel={pending.confirmLabel}
      onConfirm={() => {
        pending.resolve(true);
        setPending(null);
      }}
      onCancel={() => {
        pending.resolve(false);
        setPending(null);
      }}
    />
  ) : null;

  return { confirm, dialog };
}
