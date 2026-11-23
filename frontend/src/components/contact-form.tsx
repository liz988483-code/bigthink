"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";

type FormState = { fullName: string; email: string; phone: string; inquiryType: string; message: string; consent: boolean };
const initialState: FormState = { fullName: "", email: "", phone: "", inquiryType: "", message: "", consent: false };
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    try {
      const response = await fetch(`${apiUrl}/api/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "We could not send your message. Please check the form and try again.");
      setNotice({ type: "success", message: result.message ?? "Your message has been sent." });
      setForm(initialState);
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "We could not reach Bigthink. Please try again later." });
    } finally {
      setPending(false);
    }
  }

  return <form className="contact-form" onSubmit={submit}>
    <h2>Send Us a Message</h2>
    <div className="form-two">
      <label htmlFor="contact-name">Full Name *<input id="contact-name" required minLength={2} maxLength={140} autoComplete="name" value={form.fullName} onChange={(event)=>update("fullName",event.target.value)} placeholder="Your name"/></label>
      <label htmlFor="contact-email">Email Address *<input id="contact-email" required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={(event)=>update("email",event.target.value)} placeholder="you@example.com"/></label>
    </div>
    <div className="form-two">
      <label htmlFor="contact-phone">Phone Number<input id="contact-phone" type="tel" maxLength={32} autoComplete="tel" value={form.phone} onChange={(event)=>update("phone",event.target.value)} placeholder="+254"/></label>
      <label htmlFor="contact-type">Inquiry Type *<select id="contact-type" required value={form.inquiryType} onChange={(event)=>update("inquiryType",event.target.value)}><option value="" disabled>Select an inquiry type</option><option value="research_support">Research support</option><option value="careers_talent">Careers and talent</option><option value="procurement_supply">Procurement and supply</option><option value="events_networking">Events and networking</option><option value="partnership">Partnership</option><option value="other">Other</option></select></label>
    </div>
    <label htmlFor="contact-message">Message *<textarea id="contact-message" required minLength={10} maxLength={4000} rows={5} value={form.message} onChange={(event)=>update("message",event.target.value)} placeholder="How can we help?"/></label>
    <label className="consent-row"><input type="checkbox" required checked={form.consent} onChange={(event)=>update("consent",event.target.checked)}/><span>I agree that Bigthink may use these details to respond to this inquiry. See the <a href="/privacy">privacy notice</a>.</span></label>
    {notice&&<p className={`form-notice ${notice.type}`} role="status">{notice.message}</p>}
    <button className="button primary" type="submit" disabled={pending}>{pending?"Sending…":"Send Message"} <ArrowRight size={15}/></button>
  </form>;
}
