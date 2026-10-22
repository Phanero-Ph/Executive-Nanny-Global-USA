export function PrivatePdfPreview({ src, fileName, className = "" }: { src: string; fileName: string; className?: string }) {
 return <div className="mt-4 overflow-hidden rounded-xl border border-cream-300 bg-white">
  <div className="flex items-center justify-between gap-3 border-b border-cream-300 bg-cream-50 px-4 py-3"><strong className="break-all text-xs text-ink-900">{fileName}</strong><span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-teal-brand">Private preview</span></div>
  <iframe title={`PDF preview: ${fileName}`} src={src} loading="lazy" className={`block w-full border-0 bg-white ${className}`} />
 </div>;
}
