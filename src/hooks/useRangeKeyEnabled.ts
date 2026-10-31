import { useEffect, useState } from "react";

// Whether online RangeKey checkout is switched on. The server decides
// (GET /api/rangekey-status): it is on only when SwingRes and the plan ids are
// configured. Until it answers, or when it says no, the RangeKey card keeps
// opening the interest form, so no card is ever shown a Buy button it can't honor.
// Returns null while the answer is loading, then true or false.
export function useRangeKeyEnabled(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/rangekey-status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { enabled?: boolean } | null) => {
        if (!cancelled) setEnabled(d?.enabled === true);
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return enabled;
}
