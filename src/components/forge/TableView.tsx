import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { deleteEntry, listEntries } from "@/runtime/api";
import type { NormalizedEntity, NormalizedView } from "@/runtime/types";
import { useI18n } from "@/runtime/i18n";
import { toast } from "sonner";
import { CsvImporter } from "./CsvImporter";

interface Props {
  appId: string;
  view: NormalizedView;
  entity: NormalizedEntity;
  refreshKey?: number;
}

const renderCell = (v: unknown) => {
  if (v === null || v === undefined || v === "") return <span className="text-muted-foreground">—</span>;
  if (typeof v === "boolean") return v ? "✓" : "✗";
  if (typeof v === "object") return <code className="text-xs">{JSON.stringify(v)}</code>;
  return String(v);
};

export const TableView = ({ appId, view, entity, refreshKey = 0 }: Props) => {
  const { t } = useI18n();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const cols = (view.fields && view.fields.length
    ? entity.fields.filter((f) => view.fields!.includes(f.name))
    : entity.fields);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listEntries(appId, entity.name)
      .then((d) => !cancelled && setRows(d))
      .catch((e) => toast.error(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [appId, entity.name, refreshKey, tick]);

  const remove = async (id: string) => {
    try {
      await deleteEntry(id);
      setTick((n) => n + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    }
  };

  return (
    <Card className="p-6 border border-border bg-card shadow-card">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h3 className="text-lg font-semibold">{view.title}</h3>
        <CsvImporter
          appId={appId}
          entity={entity}
          onDone={() => setTick((n) => n + 1)}
        />
      </div>
      {loading ? (
        <div className="py-12 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> {t("common.loading")}
        </div>
      ) : rows.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">{t("run.empty")}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                {cols.map((c) => (
                  <th key={c.name} className="py-2 pr-4 font-medium">{c.label}</th>
                ))}
                <th className="py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-b-0 hover:bg-muted/40">
                  {cols.map((c) => (
                    <td key={c.name} className="py-2 pr-4">
                      {renderCell(r.data?.[c.name])}
                    </td>
                  ))}
                  <td className="py-2">
                    <Button variant="ghost" size="icon" onClick={() => remove(r.id)} aria-label={t("run.delete")}>
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};