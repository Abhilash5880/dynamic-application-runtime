import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { listEntries } from "@/runtime/api";
import type { NormalizedEntity, NormalizedView } from "@/runtime/types";
import { Loader2, TrendingUp } from "lucide-react";

interface Props {
  appId: string;
  view: NormalizedView;
  entities: NormalizedEntity[];
  refreshKey?: number;
}

export const DashboardView = ({ appId, view, entities, refreshKey = 0 }: Props) => {
  const [results, setResults] = useState<Array<{ label: string; value: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const metrics = view.metrics ?? entities.map((e) => ({
        label: `Total ${e.label}`,
        entity: e.name,
        op: "count" as const,
      }));
      const out: Array<{ label: string; value: string }> = [];
      for (const m of metrics) {
        const mm = m as { label: string; entity: string; op?: string; field?: string };
        const ent = entities.find((e) => e.name === mm.entity);
        if (!ent) {
          out.push({ label: mm.label, value: "—" });
          continue;
        }
        try {
          const rows = await listEntries(appId, ent.name);
          const op = mm.op || "count";
          if (op === "count") out.push({ label: mm.label, value: String(rows.length) });
          else if (op === "sum" && mm.field) {
            const sum = rows.reduce((a, r) => a + (Number((r as any).data?.[mm.field!]) || 0), 0);
            out.push({ label: mm.label, value: sum.toLocaleString() });
          } else if (op === "avg" && mm.field) {
            const nums = rows.map((r) => Number((r as any).data?.[mm.field!])).filter(Number.isFinite);
            const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
            out.push({ label: mm.label, value: avg.toFixed(2) });
          } else {
            out.push({ label: mm.label, value: "—" });
          }
        } catch {
          out.push({ label: mm.label, value: "—" });
        }
      }
      if (!cancelled) {
        setResults(out);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [appId, view, entities, refreshKey]);

  return (
    <Card className="p-6 shadow-card">
      <h3 className="text-lg font-semibold mb-4">{view.title}</h3>
      {loading ? (
        <div className="py-8 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r, i) => (
            <div key={i} className="rounded-xl bg-gradient-to-br from-secondary to-background border p-5">
              <div className="flex items-center justify-between text-muted-foreground text-xs uppercase tracking-wide">
                <span>{r.label}</span>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="text-3xl font-bold mt-2 text-gradient">{r.value}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};