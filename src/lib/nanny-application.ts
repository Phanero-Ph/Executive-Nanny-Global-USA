import { isValidEmail } from "@/lib/utils";
import type { ApplicationField } from "@/data/nanny-application";
type Row = Record<string, string>;
export function validRow(row: unknown, fields: ApplicationField[]): row is Row {
 if (!row || typeof row !== "object" || Array.isArray(row)) return false;
 const values = row as Record<string, unknown>;
 return fields.every(field => {
  const value = values[field.name];
  if (value === undefined || value === "") return !field.required;
  if (typeof value !== "string" || value.length > 10000 || (field.required && !value.trim())) return false;
  if (field.options && !field.options.includes(value)) return false;
  if (field.type === "email" && !isValidEmail(value.trim())) return false;
  if (field.type === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)))) return false;
  if (field.type === "number" && (!Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > 80)) return false;
  if (field.type === "checkbox" && !["Yes", "No"].includes(value)) return false;
  return true;
 });
}
