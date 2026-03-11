import Link from "next/link";

/**
 * Sign-up page — currently disabled while registration is invite-only.
 * Shows "Coming Soon" message instead of the registration form.
 * [SQ.S-W-2603-0032]
 */
export default function SignUpPage() {
  return (
    <main className="min-h-[calc(100vh-120px)] flex items-center justify-center px-6">
      <div
        className="w-full max-w-md border-3 border-ink bg-bg p-10 text-center"
        style={{ boxShadow: "6px 6px 0 var(--ink)" }}
      >
        <div className="text-4xl mb-4">🚧</div>
        <h1 className="font-head font-[900] text-[1.8rem] uppercase mb-3">
          Coming Soon
        </h1>
        <p className="font-mono text-[0.82rem] opacity-70 mb-6 leading-relaxed">
          New account registration isn&apos;t open yet.
          <br />
          Check back soon.
        </p>
        <Link
          href="/login"
          className="font-mono text-[0.78rem] underline text-ink"
        >
          Already have an account? Sign in
        </Link>
      </div>
    </main>
  );
}
