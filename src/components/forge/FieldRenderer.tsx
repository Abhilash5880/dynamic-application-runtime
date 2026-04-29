import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NormalizedField } from "@/runtime/types";

interface Props {
  field: NormalizedField;
  value: unknown;
  onChange: (v: unknown) => void;
  error?: string;
}

export const FieldRenderer = ({ field, value, onChange, error }: Props) => {
  const id = `f_${field.name}`;
  const common = "transition-colors";

  const input = (() => {
    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            id={id}
            value={(value as string) ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
          />
        );
      case "boolean":
        return (
          <div className="flex items-center h-10">
            <Switch checked={!!value} onCheckedChange={onChange} />
          </div>
        );
      case "select": {
        const opts = (field.options ?? []).map((o) =>
          typeof o === "string" ? { value: o, label: o } : { value: o.value, label: o.label ?? o.value },
        );
        return (
          <Select value={(value as string) ?? ""} onValueChange={onChange}>
            <SelectTrigger id={id} className={common}>
              <SelectValue placeholder={field.placeholder ?? "Select…"} />
            </SelectTrigger>
            <SelectContent>
              {opts.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      case "number":
        return (
          <Input
            id={id}
            type="number"
            value={(value as string | number | undefined) ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case "date":
        return (
          <Input
            id={id}
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case "email":
      case "url":
        return (
          <Input
            id={id}
            type={field.type}
            value={(value as string) ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      default:
        return (
          <Input
            id={id}
            type="text"
            value={(value as string) ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  })();

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {input}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};