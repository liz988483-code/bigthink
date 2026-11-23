import { SiteHeader, SiteFooter } from "@/components/site";
import { ContactForm } from "@/components/contact-form";
import { Mail, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
  return <><SiteHeader active="Contact"/><main>
    <section className="subhero contact"><div className="subhero-img" style={{backgroundImage:"url(https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1800&q=85)"}}/><div className="subhero-overlay"/><div className="wrap subhero-content"><p className="eyebrow light">LET’S TALK</p><h1>Contact Us</h1><p>We’d love to hear from you. Get in touch for inquiries, partnerships or support.</p><a href="#contact-form" className="button primary">Send Us a Message</a></div></section>
    <section id="contact-form" className="wrap contact-layout"><ContactForm/><aside className="contact-aside"><h2>Contact Information</h2><p><MapPin size={15}/> &nbsp; Nairobi, Kenya<br/><small>Western Heights, Nairobi</small></p><p><Mail size={15}/> &nbsp; <a href="mailto:info@bigthink.co.ke">info@bigthink.co.ke</a><br/><small>We respond within 24 hours</small></p><p><Phone size={15}/> &nbsp; <a href="tel:+254700123456">+254 700 123 456</a><br/><small>Mon – Fri, 8:00 AM – 5:00 PM</small></p><h3>Follow Us</h3><div className="map-placeholder">Nairobi, Kenya <MapPin size={23}/></div></aside></section>
  </main><SiteFooter/></>;
}
