import { SiteHeader, SiteFooter } from "@/components/site";
import { ArrowRight, BarChart3, BookOpen, ClipboardCheck, FileText, Lightbulb, Users } from "lucide-react";

const services = [
  { icon: Lightbulb, title: "Research design & methods", description: "Refine your research question, choose a suitable approach and plan the work clearly." },
  { icon: FileText, title: "Academic writing & editing", description: "Improve structure, clarity, referencing and presentation in your academic writing." },
  { icon: BarChart3, title: "Data analysis & interpretation", description: "Get support organizing, analyzing and explaining qualitative or quantitative data." },
  { icon: BookOpen, title: "Publication & proposal support", description: "Prepare manuscripts, research proposals and funding applications for review." },
];
const steps = [
  { title: "Tell us what you’re working on", text: "Share your research stage, question and the kind of support you need." },
  { title: "Agree on a clear scope", text: "Discuss a suitable service, timeline and expected deliverables." },
  { title: "Work with an expert", text: "Get focused guidance and feedback as your research progresses." },
  { title: "Review and move forward", text: "Receive your agreed output and understand the next practical steps." },
];

export default function ThinkPage() {
  return <><SiteHeader active="Think"/><main>
    <section className="subhero think"><div className="subhero-img" style={{backgroundImage:"url(https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1800&q=85)"}}/><div className="subhero-overlay"/><div className="wrap subhero-content"><p className="eyebrow light">THINK · RESEARCH & KNOWLEDGE</p><h1>Research with Clarity</h1><p>Practical support for your academic, professional and organizational research journey.</p><a href="#services" className="button primary">Explore Research Support <ArrowRight size={15}/></a></div></section>
    <section className="wrap think-intro"><div><p className="eyebrow">KNOWLEDGE THAT MOVES YOU FORWARD</p><h2>Get the right support at every stage of your research.</h2></div><div><p>Bigthink Think helps students, researchers, professionals and organizations turn ideas into clear, useful research.</p><p>Choose focused guidance for a specific challenge or discuss support across a larger project.</p></div></section>
    <section className="think-service-section" id="services"><div className="wrap"><div className="grow-section-heading"><div><p className="eyebrow">RESEARCH SERVICES</p><h2>Ways we can support your work</h2><p>Support is scoped to your goals, discipline and stage of work.</p></div></div><div className="think-service-grid">{services.map(({icon:Icon,title,description})=><article className="think-service" key={title}><span className="think-service-icon"><Icon size={21}/></span><h3>{title}</h3><p>{description}</p><a href="/contact">Discuss this service <ArrowRight size={14}/></a></article>)}</div></div></section>
    <section className="grow-how think-how"><div className="wrap"><p className="eyebrow">A SUPPORTIVE, PRACTICAL PROCESS</p><h2>How research support works</h2><div className="grow-steps">{steps.map(({title,text},index)=><article className="grow-step" key={title}><span className="grow-step-number">{index+1}</span><span className="grow-step-icon"><ClipboardCheck size={20}/></span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
    <section className="wrap think-audiences"><div><Users size={24}/><div><h2>Who we work with</h2><p>Students and graduates · Researchers and academics · Professionals · Businesses and organizations</p></div></div><a className="button primary" href="/contact">Start a research inquiry <ArrowRight size={15}/></a></section>
  </main><SiteFooter/></>;
}
