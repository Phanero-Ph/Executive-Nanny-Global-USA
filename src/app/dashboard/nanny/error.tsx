"use client";
export default function FamilyDashboardError({ reset }: { reset: () => void }) {
 return <section className="px-6 py-16 text-center"><h1 className="text-2xl text-ink-900">We couldn&apos;t load your dashboard</h1><p className="mt-3 text-slate-500">Your requests are still saved. Please try again.</p><button onClick={reset} className="application-submit mt-6">Try again</button></section>;
}
