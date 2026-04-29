import type {
  AppConfig,
  EntityConfig,
  FieldConfig,
  NormalizedConfig,
  NormalizedEntity,
  NormalizedField,
  NormalizedView,
  ViewConfig,
} from "./types";

const KNOWN_FIELD_TYPES = new Set([
  "text",
  "textarea",
  "number",
  "email",
  "url",
  "date",
  "boolean",
  "select",
]);

const KNOWN_VIEW_TYPES = new Set(["form", "table", "dashboard"]);

function humanize(s: string) {
  return s
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function slug(s: string) {
  return (s || "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeField(f: FieldConfig | string, warnings: string[]): NormalizedField | null {
  if (typeof f === "string") f = { name: f };
  if (!f || typeof f !== "object") return null;
  const name = slug(f.name || "");
  if (!name) {
    warnings.push(`Skipped a field with missing name`);
    return null;
  }
  let type = (f.type || "text").toString();
  if (!KNOWN_FIELD_TYPES.has(type)) {
    warnings.push(`Unknown field type "${type}" on "${name}" — falling back to text`);
    type = "text";
  }
  return {
    ...f,
    name,
    label: f.label || humanize(name),
    type,
    required: !!f.required,
    options: Array.isArray(f.options) ? f.options : undefined,
  };
}

function normalizeEntity(e: EntityConfig, warnings: string[]): NormalizedEntity | null {
  if (!e || typeof e !== "object") return null;
  const name = slug(e.name || "");
  if (!name) {
    warnings.push(`Skipped an entity with missing name`);
    return null;
  }
  const rawFields = Array.isArray(e.fields) ? e.fields : [];
  const fields = rawFields
    .map((f) => normalizeField(f, warnings))
    .filter((f): f is NormalizedField => !!f);
  if (fields.length === 0) {
    warnings.push(`Entity "${name}" has no fields — adding a default "title" text field`);
    fields.push({ name: "title", label: "Title", type: "text", required: false });
  }
  return { name, label: e.label || humanize(name), fields };
}

function normalizeView(
  v: ViewConfig,
  entities: NormalizedEntity[],
  warnings: string[],
  idx: number,
): NormalizedView | null {
  if (!v || typeof v !== "object") return null;
  let type = (v.type || "table").toString();
  if (!KNOWN_VIEW_TYPES.has(type)) {
    warnings.push(`Unknown view type "${type}" — falling back to table`);
    type = "table";
  }
  const id = v.id || `view_${idx + 1}`;
  const title = v.title || (v.entity ? humanize(v.entity) : `View ${idx + 1}`);
  let entity = v.entity ? slug(v.entity) : undefined;
  if (entity && !entities.find((e) => e.name === entity)) {
    warnings.push(`View "${title}" references unknown entity "${entity}"`);
    entity = undefined;
  }
  return {
    id,
    type,
    title,
    entity,
    fields: Array.isArray(v.fields) ? v.fields.map(slug) : undefined,
    metrics: Array.isArray(v.metrics) ? v.metrics : undefined,
  };
}

export function normalizeConfig(input: unknown): NormalizedConfig {
  const warnings: string[] = [];
  const cfg: AppConfig = (input && typeof input === "object" ? (input as AppConfig) : {}) || {};

  const rawEntities = Array.isArray(cfg.entities) ? cfg.entities : [];
  const entities = rawEntities
    .map((e) => normalizeEntity(e, warnings))
    .filter((e): e is NormalizedEntity => !!e);

  let rawViews = Array.isArray(cfg.views) ? cfg.views : [];
  // If no views are defined, auto-generate a sensible default per entity (form + table)
  if (rawViews.length === 0 && entities.length > 0) {
    rawViews = entities.flatMap((e) => [
      { id: `${e.name}_form`, type: "form" as const, title: `New ${e.label}`, entity: e.name },
      { id: `${e.name}_table`, type: "table" as const, title: e.label, entity: e.name },
    ]);
    warnings.push(`No views defined — generated default form + table per entity`);
  }

  const views = rawViews
    .map((v, i) => normalizeView(v, entities, warnings, i))
    .filter((v): v is NormalizedView => !!v);

  if (entities.length === 0) {
    warnings.push(`No entities defined — the app will have nothing to render`);
  }

  return {
    name: (cfg.name || "Untitled App").toString(),
    description: (cfg.description || "").toString(),
    entities,
    views,
    warnings,
  };
}

export const __helpers = { humanize, slug };