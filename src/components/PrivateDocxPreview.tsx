"use client";

import { useEffect, useState } from "react";
import styles from "./PrivateDocxPreview.module.css";

type ZipEntry = { data: Uint8Array; method: number };
function inflateRaw(bytes: Uint8Array) {
 const copy = new Uint8Array(bytes.byteLength);
 copy.set(bytes);
 const Format = DecompressionStream as unknown as new (format: string) => TransformStream<Uint8Array, Uint8Array>;
 return new Blob([copy.buffer]).stream().pipeThrough(new Format("deflate-raw"));
}

function findZipEntry(archive: Uint8Array, target: string): ZipEntry | null {
 const view = new DataView(archive.buffer, archive.byteOffset, archive.byteLength);
 let end = -1;
 for (let i = archive.length - 22; i >= Math.max(0, archive.length - 65_557); i--) {
  if (view.getUint32(i, true) === 0x06054b50) { end = i; break; }
 }
 if (end < 0) return null;
 const entries = view.getUint16(end + 10, true);
 let offset = view.getUint32(end + 16, true);
 const decoder = new TextDecoder();
 for (let index = 0; index < entries; index++) {
  if (view.getUint32(offset, true) !== 0x02014b50) return null;
  const method = view.getUint16(offset + 10, true);
  const compressedSize = view.getUint32(offset + 20, true);
  const nameLength = view.getUint16(offset + 28, true);
  const extraLength = view.getUint16(offset + 30, true);
  const commentLength = view.getUint16(offset + 32, true);
  const localOffset = view.getUint32(offset + 42, true);
  const name = decoder.decode(archive.subarray(offset + 46, offset + 46 + nameLength));
  if (name === target) {
   if (view.getUint32(localOffset, true) !== 0x04034b50) return null;
   const localNameLength = view.getUint16(localOffset + 26, true);
   const localExtraLength = view.getUint16(localOffset + 28, true);
   const start = localOffset + 30 + localNameLength + localExtraLength;
   return { data: archive.subarray(start, start + compressedSize), method };
  }
  offset += 46 + nameLength + extraLength + commentLength;
 }
 return null;
}

async function unzipText(archive: Uint8Array, path: string): Promise<string | null> {
 const entry = findZipEntry(archive, path);
 if (!entry) return null;
 let bytes = entry.data;
 if (entry.method === 8) {
  const stream = inflateRaw(bytes);
  bytes = new Uint8Array(await new Response(stream).arrayBuffer());
 } else if (entry.method !== 0) throw new Error("This Word document uses an unsupported compression format.");
 return new TextDecoder().decode(bytes);
}

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const REL = "http://schemas.openxmlformats.org/package/2006/relationships";
const A = "http://schemas.openxmlformats.org/drawingml/2006/main";
const IMAGE_TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", bmp: "image/bmp", webp: "image/webp" };
const esc = (text: string) => text.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
function nodes(element: Element, namespace: string, name: string) { return Array.from(element.getElementsByTagNameNS(namespace, name)); }
function normalizedWordPath(target: string) {
 const parts: string[] = [];
 for (const part of target.replace(/^\//, "").split("/")) { if (part === "..") parts.pop(); else if (part && part !== ".") parts.push(part); }
 return target.startsWith("/") ? parts.join("/") : `word/${parts.join("/")}`;
}

async function renderDocx(buffer: ArrayBuffer): Promise<string> {
 const archive = new Uint8Array(buffer);
 const xml = await unzipText(archive, "word/document.xml");
 if (!xml) throw new Error("The document does not contain readable Word content.");
 const parsed = new DOMParser().parseFromString(xml, "application/xml");
 if (parsed.querySelector("parsererror")) throw new Error("This Word document could not be read.");

 const relationships = new Map<string, { target: string; external: boolean }>();
 const relXml = await unzipText(archive, "word/_rels/document.xml.rels");
 if (relXml) {
  const rels = new DOMParser().parseFromString(relXml, "application/xml");
  for (const rel of Array.from(rels.getElementsByTagNameNS(REL, "Relationship"))) {
   relationships.set(rel.getAttribute("Id") || "", { target: rel.getAttribute("Target") || "", external: rel.getAttribute("TargetMode") === "External" });
  }
 }
 const imageUrls = new Map<string, string>();
 for (const [id, rel] of relationships) {
  if (rel.external || !rel.target.startsWith("media/")) continue;
  const image = findZipEntry(archive, normalizedWordPath(rel.target));
  if (!image) continue;
  let bytes = image.data;
  if (image.method === 8) {
   bytes = new Uint8Array(await new Response(inflateRaw(bytes)).arrayBuffer());
  } else if (image.method !== 0) continue;
  const ext = rel.target.split(".").pop()?.toLowerCase() || "";
  const mime = IMAGE_TYPES[ext];
  if (!mime) continue;
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  imageUrls.set(id, `data:${mime};base64,${btoa(binary)}`);
 }

 function renderRunContent(node: Element): string {
  if (node.namespaceURI === W && node.localName === "t") return esc(node.textContent || "");
  if (node.namespaceURI === W && node.localName === "tab") return "&nbsp;&nbsp;&nbsp;&nbsp;";
  if (node.namespaceURI === W && node.localName === "br") return "<br/>";
  if (node.namespaceURI === W && node.localName === "drawing") {
   const blip = nodes(node, A, "blip")[0];
   const url = blip ? imageUrls.get(blip.getAttributeNS(R, "embed") || "") : null;
   return url ? `<img src="${url}" alt="Embedded document image"/>` : "";
  }
  if (node.namespaceURI === W && node.localName === "pict") {
   const imageData = Array.from(node.getElementsByTagName("v:imagedata"))[0];
   const url = imageData ? imageUrls.get(imageData.getAttribute("r:id") || "") : null;
   return url ? `<img src="${url}" alt="Embedded document image"/>` : "";
  }
  const inner = Array.from(node.children).map(renderRunContent).join("");
  if (node.namespaceURI === W && node.localName === "r") {
   const props = nodes(node, W, "rPr")[0];
   let content = inner;
   if (props && nodes(props, W, "b").length) content = `<strong>${content}</strong>`;
   if (props && nodes(props, W, "i").length) content = `<em>${content}</em>`;
   if (props && nodes(props, W, "u").length) content = `<u>${content}</u>`;
   return content;
  }
  if (node.namespaceURI === W && node.localName === "hyperlink") {
   const rel = relationships.get(node.getAttributeNS(R, "id") || "");
   if (rel?.external && /^https?:\/\//i.test(rel.target)) return `<a href="${esc(rel.target)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
  }
  return inner;
 }

 function paragraph(element: Element): string {
  const pPr = nodes(element, W, "pPr")[0];
  const style = pPr && nodes(pPr, W, "pStyle")[0]?.getAttributeNS(W, "val");
  const alignment = pPr && nodes(pPr, W, "jc")[0]?.getAttributeNS(W, "val");
  const content = Array.from(element.children).filter(child => child.localName !== "pPr").map(renderRunContent).join("") || "&nbsp;";
  const align = alignment && ["left", "center", "right", "both"].includes(alignment) ? ` style="text-align:${alignment === "both" ? "justify" : alignment}"` : "";
  const level = style?.match(/^Heading([1-6])$/i)?.[1];
  if (level) return `<h${level}${align}>${content}</h${level}>`;
  return `<p${align}>${content}</p>`;
 }

 function table(element: Element): string {
  const rows = Array.from(element.children).filter(child => child.namespaceURI === W && child.localName === "tr").map(row => `<tr>${Array.from(row.children).filter(cell => cell.namespaceURI === W && cell.localName === "tc").map(cell => `<td>${Array.from(cell.children).filter(child => child.namespaceURI === W && child.localName === "p").map(paragraph).join("")}</td>`).join("")}</tr>`).join("");
  return `<table><tbody>${rows}</tbody></table>`;
 }

 const body = parsed.getElementsByTagNameNS(W, "body")[0];
 if (!body) throw new Error("This Word document has no readable body content.");
 return Array.from(body.children).map(child => child.namespaceURI === W && child.localName === "p" ? paragraph(child) : child.namespaceURI === W && child.localName === "tbl" ? table(child) : "").join("");
}

export function PrivateDocxPreview({ src, fileName }: { src: string; fileName: string }) {
 const [html, setHtml] = useState("");
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(true);
 useEffect(() => {
  let cancelled = false;
  async function load() {
   setLoading(true); setError(""); setHtml("");
   try {
    const response = await fetch(src, { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new Error(response.status === 403 ? "You do not have permission to view this document." : "The document could not be loaded.");
    const content = await renderDocx(await response.arrayBuffer());
    if (!cancelled) setHtml(content);
   } catch (cause) {
    if (!cancelled) setError(cause instanceof Error ? cause.message : "This Word document could not be previewed in this browser.");
   } finally { if (!cancelled) setLoading(false); }
  }
  void load();
  return () => { cancelled = true; };
 }, [src]);
 return <section aria-label={`Preview of ${fileName}`} className="mt-4 overflow-hidden rounded-xl border border-cream-300 bg-white">
  <div className="flex items-center justify-between border-b border-cream-300 bg-cream-50 px-4 py-3"><strong className="break-all text-xs text-ink-900">{fileName}</strong><span className="ml-3 shrink-0 text-[10px] font-bold uppercase tracking-wider text-teal-brand">Private preview</span></div>
  {loading?<p className="p-5 text-sm text-slate-500">Preparing document preview…</p>:error?<p role="status" className="p-5 text-sm text-amber-800">{error}</p>:<article className={styles.content} dangerouslySetInnerHTML={{__html:html}}/>}
 </section>;
}
