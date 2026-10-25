import Link from "next/link";

export function VerificationSignOut() {
  return (
    <div className="mt-5 text-center">
      <Link href="/login" className="text-xs text-slate-500 underline hover:text-ink-900">
        Sign in
      </Link>
    </div>
  );
}
