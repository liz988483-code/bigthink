"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function AccountForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const isRegister = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const response = await fetch(`${apiUrl}/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "We could not complete your request.");
      router.push("/account");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not reach Bigthink. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return <main className="mx-auto min-h-[70vh] max-w-lg px-5 py-14">
    <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
      <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-emerald-700">Bigthink account</p>
      <h1 className="mb-2 text-3xl font-bold text-slate-950">{isRegister ? "Join the community" : "Welcome back"}</h1>
      <p className="mb-7 text-sm leading-6 text-slate-600">{isRegister ? "Create an account to connect with knowledge, opportunities and business." : "Sign in to continue to your Bigthink account."}</p>
      <form className="space-y-4" onSubmit={submit}>
        {isRegister && <label className="block text-sm font-semibold text-slate-700">Full name<input name="fullName" required minLength={2} maxLength={140} autoComplete="name" className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-3 font-normal outline-emerald-600" placeholder="Your full name"/></label>}
        <label className="block text-sm font-semibold text-slate-700">Email address<input name="email" required type="email" maxLength={254} autoComplete="email" className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-3 font-normal outline-emerald-600" placeholder="you@example.com"/></label>
        <label className="block text-sm font-semibold text-slate-700">Password<input name="password" required type="password" minLength={isRegister ? 12 : 1} maxLength={128} autoComplete={isRegister ? "new-password" : "current-password"} className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-3 font-normal outline-emerald-600" placeholder={isRegister ? "At least 12 characters" : "Your password"}/></label>
        {isRegister && <label className="block text-sm font-semibold text-slate-700">I am joining as<select name="role" required defaultValue="candidate" className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-3 font-normal outline-emerald-600"><option value="candidate">Student or job seeker</option><option value="employer">Employer</option><option value="skilled_provider">Skilled service provider</option><option value="supplier">Supplier</option><option value="buyer">Buyer</option><option value="event_member">Events and networking member</option></select></label>}
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
        <button type="submit" disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60">{pending ? "Please wait…" : isRegister ? "Create Account" : "Sign In"}<ArrowRight size={16}/></button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">{isRegister ? "Already have an account? " : "New to Bigthink? "}<Link className="font-semibold text-emerald-700 underline" href={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create one"}</Link></p>
      <p className="mt-5 text-center text-xs text-slate-500">By continuing, you agree to our <Link className="underline" href="/privacy">privacy notice</Link>.</p>
    </div>
  </main>;
}
