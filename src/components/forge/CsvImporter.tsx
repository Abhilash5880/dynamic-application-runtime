import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import { bulkInsert, validateRecord } from "@/runtime/api";
import { useI18n } from "@/runtime/i18n";
import { toast } from "sonner";
import type { NormalizedEntity } from "@/runtime/types";

// Tiny robust CSV parser supporting quoted fields and escaped quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
      else if (c === "\r") { /* skip */ }
      else cur += c;
    }
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.length));
}

interface Props {
  appId: string;
  entity: NormalizedEntity;
  onDone?: () => void;
}

export const CsvImporter = ({ appId, entity, onDone }: Props) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const rows = parseCsv(text);
      if (rows.length === 0) return;
      const [h, ...rest] = rows;
      setHeaders(h.map((s) => s.trim()));
      setData(rest);
      // auto-map by exact or normalized name match
      const auto: Record<string, string> = {};
      for (const f of entity.fields) {
        const idx = h.findIndex(
          (x) => x.trim().toLowerCase().replace(/\s+/g, "_") === f.name,
        );
        if (idx >= 0) auto[f.name] = h[idx];
      }
      setMapping(auto);
    };
    reader.readAsText(file);
  };

  const doImport = async () => {
    setBusy(true);
    try {
      const headerIdx: Record<string, number> = {};
      headers.forEach((h, i) => (headerIdx[h] = i));
      const rows = data.map((row) => {
        const raw: Record<string, unknown> = {};
        for (const [field, header] of Object.entries(mapping)) {
          if (!header) continue;
          raw[field] = row[headerIdx[header]];
        }
        const v = validateRecord(entity.fields, raw);
        return v.ok ? v.data : raw; // if invalid, store raw — partial data is better than nothing
      });
      await bulkInsert(appId, entity.name, rows);
      toast.success(`Imported ${rows.length} rows`);
      setOpen(false);
      setHeaders([]);
      setData([]);
      setMapping({});
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" /> {t("run.csvImport")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("run.csvImport")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t("run.csvHelp")}</p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
        />
        {headers.length > 0 && (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {entity.fields.map((f) => (
              <div key={f.name} className="grid grid-cols-2 gap-2 items-center">
                <Label className="text-sm">{f.label}</Label>
                <Select
                  value={mapping[f.name] ?? "__none__"}
                  onValueChange={(v) =>
                    setMapping((m) => ({ ...m, [f.name]: v === "__none__" ? "" : v }))
                  }
                >
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— skip —</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">{data.length} rows ready.</p>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>{t("run.cancel")}</Button>
          <Button onClick={doImport} disabled={!data.length || busy} className="gap-2">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("run.import")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};