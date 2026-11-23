import Link from "next/link";

export const metadata = { title: "Privacy Notice | Bigthink", description: "How Bigthink uses information submitted through its contact form." };

export default function PrivacyPage() {
  return <main className="mx-auto min-h-[65vh] max-w-4xl px-6 py-16 text-slate-800">
    <p className="mb-3 text-sm font-semibold uppercase tracking-[.16em] text-emerald-700">Bigthink</p>
    <h1 className="mb-6 text-4xl font-bold text-slate-950">Privacy notice</h1>
    <p className="mb-8 text-lg text-slate-600">This notice explains how Bigthink handles information you submit through the website contact form.</p>
    <section className="space-y-5 leading-7">
      <div><h2 className="text-xl font-semibold text-slate-950">Information collected</h2><p>When you contact us, we collect your name, email address, optional phone number, inquiry type and message.</p></div>
      <div><h2 className="text-xl font-semibold text-slate-950">How it is used</h2><p>We use those details to understand and respond to your inquiry. The information is stored in Bigthink’s inquiry system and made available to team members handling the request.</p></div>
      <div><h2 className="text-xl font-semibold text-slate-950">Your choices and requests</h2><p>You may ask us about the personal information you submitted, or request access, correction or deletion, by emailing <a className="font-semibold text-emerald-700 underline" href="mailto:info@bigthink.co.ke">info@bigthink.co.ke</a>.</p></div>
      <div><h2 className="text-xl font-semibold text-slate-950">Before launch</h2><p>This initial notice covers the contact form only. Bigthink should confirm its data controller details, hosting and service providers, retention period and full platform privacy terms before accepting live user accounts.</p></div>
    </section>
    <Link className="mt-10 inline-flex font-semibold text-emerald-700 underline" href="/contact">Back to Contact</Link>
  </main>;
}
