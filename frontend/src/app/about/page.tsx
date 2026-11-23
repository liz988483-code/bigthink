import { SiteHeader, SiteFooter } from "@/components/site";
import { ArrowRight, BookOpen, HeartHandshake, Lightbulb, Target, Users, Building2, CalendarDays } from "lucide-react";

const values = [
  { icon: Lightbulb, title: "Knowledge", text: "We value sound information, thoughtful research and continuous learning." },
  { icon: HeartHandshake, title: "Integrity", text: "We aim to build trust through clear communication and responsible practice." },
  { icon: Users, title: "Opportunity", text: "We work to create useful connections that help people and organizations grow." },
];
const pathways = [
  { icon: BookOpen, title: "Think", text: "Research, knowledge and learning.", href: "/think", color: "blue" },
  { icon: Users, title: "Grow", text: "Talent, careers and skills.", href: "/grow", color: "green" },
  { icon: Building2, title: "Build", text: "Business, procurement and supply.", href: "/build", color: "orange" },
  { icon: CalendarDays, title: "Connect", text: "Events, networks and relationships.", href: "/connect", color: "purple" },
];

export default function AboutPage() {
  return <><SiteHeader active="About"/><main>
    <section className="subhero about"><div className="subhero-img" style={{backgroundImage:"url(https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1800&q=85)"}}/><div className="subhero-overlay"/><div className="wrap subhero-content"><p className="eyebrow light">KNOWLEDGE. PEOPLE. BUSINESS.</p><h1>About Bigthink</h1><p>Connecting people, knowledge, opportunities and businesses to create real growth and lasting impact.</p><a href="#our-vision" className="button primary">Get to Know Us <ArrowRight size={15}/></a></div></section>
    <section className="wrap about-intro" id="our-vision"><div><p className="eyebrow">WHO WE ARE</p><h2>A growing platform for knowledge, people and business.</h2></div><div><p>Bigthink Business Consultants is building a connected ecosystem that helps people and organizations find knowledge, develop capability and discover opportunities.</p><p>Our four pathways bring research, talent, business networks and professional connections together in one place.</p></div></section>
    <section className="about-purpose"><div className="wrap about-purpose-grid"><article><span><Target size={20}/></span><p className="eyebrow">OUR VISION</p><h2>A community where knowledge and capability create opportunity.</h2><p>We see a future where people and businesses can find the insight, skills and connections they need to grow.</p></article><article><span><HeartHandshake size={20}/></span><p className="eyebrow">OUR MISSION</p><h2>Make useful connections easier to find.</h2><p>We provide practical services and platforms that link research, talent, business and community.</p></article></div></section>
    <section className="wrap about-values"><div className="grow-section-heading"><div><p className="eyebrow">WHAT GUIDES US</p><h2>Our values</h2></div></div><div className="about-value-grid">{values.map(({icon:Icon,title,text})=><article className="about-value" key={title}><span><Icon size={20}/></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="about-pathways"><div className="wrap"><p className="eyebrow">ONE BIGTHINK, FOUR PATHWAYS</p><h2>Explore how we connect the dots.</h2><div className="about-pathway-grid">{pathways.map(({icon:Icon,title,text,href,color})=><a href={href} className={`about-pathway ${color}`} key={title}><span><Icon size={20}/></span><h3>{title}</h3><p>{text}</p><b>Explore {title} <ArrowRight size={14}/></b></a>)}</div></div></section>
    <section className="wrap about-cta"><div><p className="eyebrow">LET’S BUILD WHAT’S NEXT</p><h2>Find the pathway that fits your goals.</h2></div><a className="button primary" href="/contact">Talk to Bigthink <ArrowRight size={15}/></a></section>
  </main><SiteFooter/></>;
}
