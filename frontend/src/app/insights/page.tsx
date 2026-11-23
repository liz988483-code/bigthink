import { SiteHeader, SiteFooter } from "@/components/site";
import { InsightsBrowser } from "@/components/insights-browser";
import { ArrowRight } from "lucide-react";

export default function InsightsPage() {
  return <><SiteHeader active="Insights"/><main>
    <section className="subhero insights"><div className="subhero-img" style={{backgroundImage:"url(https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1800&q=85)"}}/><div className="subhero-overlay"/><div className="wrap subhero-content"><p className="eyebrow light">IDEAS. KNOWLEDGE. OPPORTUNITIES.</p><h1>Insights</h1><p>Practical ideas and guides for research, careers, procurement and professional growth.</p><a href="#articles" className="button primary">Explore Articles <ArrowRight size={15}/></a></div></section>
    <section className="wrap insights-directory" id="articles"><div className="grow-section-heading"><div><p className="eyebrow">LEARN SOMETHING USEFUL</p><h2>Ideas for your next step</h2><p>Explore practical articles from across the Bigthink community.</p></div></div><InsightsBrowser/></section>
    <section className="insights-contribute"><div className="wrap"><div><p className="eyebrow">SHARE YOUR EXPERIENCE</p><h2>Have an idea worth sharing?</h2><p>Bigthink welcomes useful perspectives from researchers, professionals, suppliers and community partners.</p></div><a className="button primary" href="/contact">Pitch an idea <ArrowRight size={14}/></a></div></section>
  </main><SiteFooter/></>;
}
