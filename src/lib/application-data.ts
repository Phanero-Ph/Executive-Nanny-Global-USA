export type ApplicationData = {
 version: number;
 values: Record<string, string>;
 references: Record<string, string>[];
 workHistory: Record<string, string>[];
 languages: Record<string, string>[];
 attachments: { field: string; name: string; storedName: string }[];
};
export const EDITABLE_APPLICATION_STATUSES = ["draft", "submitted", "document_review", "changes_requested"];
export function parseApplication(bio: string | null): ApplicationData | null {
 try {
  const data = JSON.parse(bio || "");
  if (data.version !== 1 || !data.values || typeof data.values !== "object" || !Array.isArray(data.references) || !Array.isArray(data.workHistory) || !Array.isArray(data.languages) || !Array.isArray(data.attachments)) return null;
  return data as ApplicationData;
 } catch { return null; }
}
