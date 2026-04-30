// Dynamic Application Runtime config types — intentionally permissive. The runtime tolerates
// missing/unknown fields and degrades gracefully.

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "url"
  | "date"
  | "boolean"
  | "select"
  | string; // unknown types are tolerated

export interface FieldConfig {
  name: string;
  label?: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: Array<string | { value: string; label?: string }>;
  default?: unknown;
  min?: number;
  max?: number;
}

export interface EntityConfig {
  name: string;
  label?: string;
  fields?: FieldConfig[];
}

export type ViewType = "form" | "table" | "dashboard" | string;

export interface ViewConfig {
  id?: string;
  type: ViewType;
  title?: string;
  entity?: string;
  fields?: string[]; // optional column subset
  metrics?: Array<{
    label: string;
    entity: string;
    op?: "count" | "sum" | "avg";
    field?: string;
  }>;
}

export interface AppConfig {
  name?: string;
  description?: string;
  entities?: EntityConfig[];
  views?: ViewConfig[];
}

export interface NormalizedField extends FieldConfig {
  name: string;
  label: string;
  type: FieldType;
}

export interface NormalizedEntity {
  name: string;
  label: string;
  fields: NormalizedField[];
}

export interface NormalizedView {
  id: string;
  type: ViewType;
  title: string;
  entity?: string;
  fields?: string[];
  metrics?: ViewConfig["metrics"];
}

export interface NormalizedConfig {
  name: string;
  description: string;
  entities: NormalizedEntity[];
  views: NormalizedView[];
  warnings: string[];
}