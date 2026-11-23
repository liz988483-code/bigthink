import { SiteHeader, SiteFooter } from "@/components/site";
import { GrowOpportunities } from "@/components/grow-opportunities";
import { ArrowRight, Check, ClipboardCheck, Search, Sparkles, UserRoundCheck } from "lucide-react";

const steps = [
  { icon: ClipboardCheck, title: "Build your profile", text: "Tell us about your education, skills and the opportunity you want." },
  { icon: Search, title: "Get prepared", text: "Review your strengths and identify the support that can help you grow." },
  { icon: Sparkles, title: "Find a match", text: "Explore relevant jobs, internships and attachment opportunities." },
  { icon: UserRoundCheck, title: "Take your next step", text: "Prepare for employer conversations and keep track of your progress." },
];

export default function GrowPage() {
  return <><SiteHeader active="Grow"/><main>
    <section className="subhero grow"><div className="subhero-img" style={{backgroundImage:"url(https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1800&q=85)"}}/><div className="subhero-overlay"/><div className="wrap subhero-content"><p className="eyebrow light">GROW · CAREERS & TALENT</p><h1>Build Your Future</h1><p>Explore jobs, internships, attachments and career development opportunities.</p><a href="#opportunities" className="button primary">Find Opportunities <ArrowRight size={15}/></a></div></section>
    <section className="wrap grow-section" id="opportunities"><div className="grow-section-heading"><div><p className="eyebrow">YOUR NEXT CAREER STEP</p><h2>Featured Opportunities</h2><p>Search the sample listings and filter by the kind of opportunity you’re looking for.</p></div><a href="/contact" className="button outline">Get career support <ArrowRight size={14}/></a></div><GrowOpportunities/></section>
    <section className="grow-how"><div className="wrap"><p className="eyebrow">A CLEAR PATH FORWARD</p><h2>How Grow works</h2><div className="grow-steps">{steps.map(({icon:Icon,title,text},index)=><article className="grow-step" key={title}><span className="grow-step-number">{index+1}</span><span className="grow-step-icon"><Icon size={20}/></span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
    <section className="wrap grow-support"><div><span className="grow-support-icon"><Check size={22}/></span><div><h2>Get ready for your next opportunity</h2><p>Bigthink can help you strengthen your profile, prepare for interviews and plan your career development.</p></div></div><a className="button primary" href="/contact">Talk to Bigthink <ArrowRight size={15}/></a></section>
  </main><SiteFooter/></>;
}
