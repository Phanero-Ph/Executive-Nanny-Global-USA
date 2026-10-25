"use client";

import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function NannyApplicationReminder({ required }: { required: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const isOpen = required && !dismissed;

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDismissed(true);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-ink-950/60 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setDismissed(true);
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nanny-application-reminder-title"
        aria-describedby="nanny-application-reminder-description"
        className="relative w-full max-w-xl rounded-3xl border border-teal-border bg-white p-6 shadow-2xl sm:p-9"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Close application reminder"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-cream-50 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-brand"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <p className="text-xs font-bold uppercase tracking-[.14em] text-teal-brand">
          Application incomplete
        </p>
        <h2
          id="nanny-application-reminder-title"
          className="mt-3 pr-10 text-2xl font-bold text-ink-900 sm:text-3xl"
        >
          Complete your nanny application
        </h2>
        <p
          id="nanny-application-reminder-description"
          className="mt-4 text-base leading-7 text-slate-600"
        >
          Your application is still a private draft. Please provide and submit your details so our team can review it. You can close this reminder and return to it later.
        </p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="application-secondary justify-center"
          >
            Remind me later
          </button>
          <Link href="/apply" onClick={() => setDismissed(true)} className="application-submit justify-center">
            Continue application <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
