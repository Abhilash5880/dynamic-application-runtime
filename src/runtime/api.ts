import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { NormalizedField } from "./types";

// Validates a record against a normalized field list. Returns either
// { ok: true, data } where data is coerced, or { ok: false, errors }.
export function validateRecord(
  fields: NormalizedField[],
  raw: Record<string, unknown>,
): { ok: true; data: Record<string, unknown> } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const data: Record<string, unknown> = {};

  for (const f of fields) {
    const v = raw[f.name];
    const empty = v === undefined || v === null || v === "";
    if (empty) {
      if (f.required) errors[f.name] = `${f.label} is required`;
      continue;
    }
    switch (f.type) {
      case "number": {
        const n = Number(v);
        if (!Number.isFinite(n)) {
          errors[f.name] = `${f.label} must be a number`;
        } else {
          if (typeof f.min === "number" && n < f.min) errors[f.name] = `${f.label} must be ≥ ${f.min}`;
          if (typeof f.max === "number" && n > f.max) errors[f.name] = `${f.label} must be ≤ ${f.max}`;
          data[f.name] = n;
        }
        break;
      }
      case "boolean":
        data[f.name] = !!v;
        break;
      case "email": {
        const s = String(v).trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) errors[f.name] = `${f.label} must be a valid email`;
        else data[f.name] = s;
        break;
      }
      case "url": {
        const s = String(v).trim();
        try {
          new URL(s);
          data[f.name] = s;
        } catch {
          errors[f.name] = `${f.label} must be a valid URL`;
        }
        break;
      }
      default:
        data[f.name] = typeof v === "string" ? v.trim() : v;
    }
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data };
}

export async function listEntries(appId: string, entity: string) {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("app_id", appId)
    .eq("entity", entity)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createEntry(appId: string, entity: string, payload: Record<string, unknown>) {
  const { data: userRes } = await supabase.auth.getUser();
  const user_id = userRes.user?.id;
  if (!user_id) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("entries")
    .insert({ app_id: appId, entity, data: payload as Json, user_id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEntry(id: string) {
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw error;
}

export async function bulkInsert(
  appId: string,
  entity: string,
  rows: Array<Record<string, unknown>>,
) {
  const { data: userRes } = await supabase.auth.getUser();
  const user_id = userRes.user?.id;
  if (!user_id) throw new Error("Not authenticated");
  const payload = rows.map((d) => ({ app_id: appId, entity, data: d as Json, user_id }));
  const { data, error } = await supabase.from("entries").insert(payload).select();
  if (error) throw error;
  return data ?? [];
}