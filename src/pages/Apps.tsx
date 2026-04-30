import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, ArrowRight, FileJson } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useI18n } from "@/runtime/i18n";
import { TopBar } from "@/components/forge/TopBar";
import { SAMPLES, SAMPLE_CRM } from "@/runtime/sampleConfigs";
import { toast } from "sonner";

interface Row {
  id: string;
  name: string;
  config: Json;
  created_at: string;
}

const Apps = () => {
  const { t } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [configText, setConfigText] = useState(JSON.stringify(SAMPLE_CRM, null, 2));
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("app_configs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setBusy(true);
    try {
      let parsed: any = {};
      try { parsed = JSON.parse(configText); } catch (e) {
        toast.error("Invalid JSON");
        setBusy(false);
        return;
      }
      const { data: userRes } = await supabase.auth.getUser();
      const user_id = userRes.user?.id;
      if (!user_id) throw new Error("Not authenticated");
      const finalName = name.trim() || parsed.name || "Untitled App";
      const { error } = await supabase
        .from("app_configs")
        .insert({ name: finalName, config: parsed as Json, user_id });
      if (error) throw error;
      toast.success("App created");
      setOpen(false);
      setName("");
      setConfigText(JSON.stringify(SAMPLE_CRM, null, 2));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("app_configs").delete().eq("id", id);
    if (error) toast.error(error.message);
    else load();
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="container mx-auto py-8 max-w-5xl px-4">
        <div className="flex items-end justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">{t("nav.apps")}</h1>
            <p className="text-muted-foreground mt-1">{t("app.tagline")}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> {t("apps.new")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("apps.create")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t("apps.name")}</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mini CRM" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>{t("apps.config")}</Label>
                    <div className="flex gap-1">
                      {SAMPLES.map((s) => (
                        <Button
                          key={s.key}
                          variant="outline"
                          size="sm"
                          onClick={() => setConfigText(JSON.stringify(s.config, null, 2))}
                        >
                          {t("apps.useSample")}: {s.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    rows={14}
                    value={configText}
                    onChange={(e) => setConfigText(e.target.value)}
                    className="font-mono text-xs"
                    spellCheck={false}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>{t("run.cancel")}</Button>
                <Button onClick={create} disabled={busy} className="gap-2">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("apps.create")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <Card className="p-12 text-center shadow-card border-dashed">
            <FileJson className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{t("apps.empty")}</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r, i) => {
              const cfg = (r.config ?? {}) as any;
              const entityCount = Array.isArray(cfg.entities) ? cfg.entities.length : 0;
              const viewCount = Array.isArray(cfg.views) ? cfg.views.length : 0;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="p-5 border border-border shadow-card transition-shadow hover:shadow-md group">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-lg leading-tight">{r.name}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => remove(r.id)}
                        aria-label={t("apps.delete")}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {entityCount} entities · {viewCount} views
                    </p>
                    <Link to={`/run/${r.id}`}>
                      <Button variant="outline" size="sm" className="mt-4 gap-1.5">
                        {t("apps.open")} <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Apps;