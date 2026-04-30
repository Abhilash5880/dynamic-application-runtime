import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldRenderer } from "./FieldRenderer";
import { validateRecord, createEntry } from "@/runtime/api";
import { useI18n } from "@/runtime/i18n";
import { toast } from "sonner";
import type { NormalizedEntity, NormalizedView } from "@/runtime/types";
import { Loader2, Plus } from "lucide-react";

interface Props {
  appId: string;
  view: NormalizedView;
  entity: NormalizedEntity;
  onCreated?: () => void;
}

export const FormView = ({ appId, view, entity, onCreated }: Props) => {
  const { t } = useI18n();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateRecord(entity.fields, values);
    if (result.ok === false) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await createEntry(appId, entity.name, result.data);
      toast.success(`${entity.label} created`);
      setValues({});
      onCreated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6 border border-border bg-card shadow-card">
      <h3 className="text-lg font-semibold mb-4">{view.title}</h3>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        {entity.fields.map((f) => (
          <FieldRenderer
            key={f.name}
            field={f}
            value={values[f.name]}
            onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))}
            error={errors[f.name]}
          />
        ))}
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {t("run.add")}
          </Button>
        </div>
      </form>
    </Card>
  );
};