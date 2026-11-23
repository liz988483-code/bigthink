import { SiteHeader, SiteFooter } from "@/components/site";
import { OpportunityList } from "@/components/opportunity-list";
import { UpcomingEvents } from "@/components/upcoming-events";
import { ArrowRight, BookOpen, BriefcaseBusiness, CalendarDays, Check, Search, Users, Building2, MapPin } from "lucide-react";

const pathways = [
  { name: "Think", label: "Research & Knowledge", color: "blue", icon: BookOpen, image: "photo-1456513080510-7bf3a84b82f8", items: ["Research support", "Editing & proofreading", "Publications & manuscripts", "Grant writing support"] },
  { name: "Grow", label: "Careers & Talent", color: "green", icon: Users, image: "photo-1521737711867-e3b97375f902", items: ["Jobs and opportunities", "Internships & attachments", "Skills assessment", "Career coaching"] },
  { name: "Build", label: "Procurement & Supply", color: "orange", icon: Building2, image: "photo-1581091226825-a6a2a5aee158", items: ["Suppliers and buyers", "Verified businesses", "Supplier connections", "Procurement opportunities"] },
  { name: "Connect", label: "Events & Networking", color: "purple", icon: CalendarDays, image: "photo-1511632765486-a01980e01a18", items: ["Business and career events", "Professional networking", "Industry meetups", "Learning opportunities"] },
];
const opportunities = [
  { initials: "ABC", title: "IT Support Intern", org: "ABC Company", type: "Internship", place: "Nairobi", time: "3 days ago", color: "blue" },
  { initials: "GT", title: "Research Assistant", org: "GreenTech Ltd", type: "Job", place: "Remote", time: "4 days ago", color: "green" },
  { initials: "X", title: "Marketing Intern", org: "XYZ Limited", type: "Internship", place: "Nairobi", time: "5 days ago", color: "dark" },
  { initials: "I", title: "Business Development", org: "Innovate Co", type: "Attachment", place: "Mombasa", time: "1 week ago", color: "blue" },
] as const;
const insights = [
  { category: "RESEARCH", title: "How to Choose a Strong Research Topic", date: "15 Mar 2025", image: "photo-1455390582262-044cdead277a", color: "blue" },
  { category: "CAREERS", title: "Top Skills Employers Look for in 2025", date: "12 Mar 2025", image: "photo-1521737711867-e3b97375f902", color: "green" },
  { category: "PROCUREMENT", title: "Building Resilient Supply Chains in Africa", date: "10 Mar 2025", image: "photo-1581091226825-a6a2a5aee158", color: "orange" },
  { category: "NETWORKING", title: "The Power of Professional Networking", date: "8 Mar 2025", image: "photo-1511632765486-a01980e01a18", color: "purple" },
];

export default function Home() {
  return <><SiteHeader active="Home" />
    <main>
      <section className="hero"><div className="hero-photo"/><div className="hero-inner"><div className="hero-copy"><p className="eyebrow light">KNOWLEDGE. PEOPLE. OPPORTUNITIES. GROWTH.</p><h1>A Brighter Future<br />Starts <span>Here.</span></h1><p className="hero-sub">Bigthink connects people, knowledge, opportunities and businesses to create real growth and lasting impact.</p><form className="searchbar" action="/search"><input name="q" aria-label="Search Bigthink" placeholder="Search jobs, internships, research support, suppliers, events..."/><button aria-label="Search"><Search size={19}/></button></form><div className="quick-tags">{["Jobs", "Internships", "Research Support", "Suppliers", "Events"].map(t=><a key={t} href={`/search?q=${encodeURIComponent(t)}`}>{t}</a>)}</div></div><div className="hero-note">People<br/>Skills<br/>Opportunities<br/>Connections<br/>Growth</div></div></section>
      <section className="pathways wrap">{pathways.map(({name,label,color,icon:Icon,image,items})=><article className="path-card" key={name}><div className="path-image" style={{backgroundImage:`url(https://images.unsplash.com/${image}?auto=format&fit=crop&w=700&q=80)`}}/><div className={`path-icon ${color}`}><Icon size={21}/></div><div className="path-content"><h2>{name} <span>→</span></h2><h3>{label}</h3><ul>{items.map(i=><li key={i}><Check size={13}/>{i}</li>)}</ul><a className={`soft-button ${color}`} href={`/${name.toLowerCase()}`}>Explore {name} <ArrowRight size={14}/></a></div></article>)}</section>
      <section className="stats-band"><div className="wrap stats-grid">{[[Users,"10,000+","Students & Professionals"],[BriefcaseBusiness,"500+","Job, Internship & Attachment Opportunities"],[Building2,"300+","Verified Suppliers & Businesses"],[CalendarDays,"100+","Events & Networking Opportunities"]].map(([Icon,value,label]:any)=><div className="stat" key={value}><Icon size={29}/><div><strong>{value}</strong><span>{label}</span></div></div>)}</div></section>
      <section className="wrap two-columns"><div className="panel"><div className="section-heading"><h2>Latest Opportunities</h2><a href="/grow">View all <ArrowRight size={14}/></a></div><OpportunityList items={opportunities}/></div><div className="panel"><div className="section-heading"><h2>Upcoming Events</h2><a href="/connect">View all <ArrowRight size={14}/></a></div><UpcomingEvents compact/></div></section>
      <section className="wrap insights-section"><div className="section-heading"><h2>Latest Insights</h2><a href="/insights">View all <ArrowRight size={14}/></a></div><div className="insight-grid">{insights.map(i=><a className="insight-card" href="/insights" key={i.title}><div className="insight-image" style={{backgroundImage:`url(https://images.unsplash.com/${i.image}?auto=format&fit=crop&w=700&q=80)`}}/><span className={`category ${i.color}`}>{i.category}</span><div className="insight-text"><b>{i.title}</b><span>{i.date}<ArrowRight size={15}/></span></div></a>)}</div></section>
      <section className="testimonials"><div className="wrap"><h2>What Our Community Says</h2><div className="quotes">{[["Sarah Wanjiku","Student, University of Nairobi","Bigthink helped me secure an internship that has kickstarted my career. The platform is easy to use and full of real opportunities.","photo-1534528741775-53994a69daeb"],["Daniel Ochieng","Master’s Student","The research support I received was professional, timely and of high quality. Highly recommended!","photo-1500648767791-00dcc994a43e"],["Grace Njeri","Business Owner","We have connected with reliable suppliers and grown our business through Bigthink’s procurement network.","photo-1531123897727-8f129e1688ce"]].map(([name,role,quote,img])=><article className="quote-card" key={name}><div className="avatar" style={{backgroundImage:`url(https://images.unsplash.com/${img}?auto=format&fit=crop&w=120&q=80)`}}/><div><p>“{quote}”</p><b>{name}</b><small>{role}</small></div></article>)}</div><div className="dots">● <span>● ● ●</span></div></div></section>
      <section className="join-banner"><div className="join-shade"/><div className="wrap join-content"><div><h2>Be Part of a Growing Community</h2><p>Whether you are a student, professional, business or supplier, Bigthink gives you the tools, knowledge and connections to achieve your goals.</p></div><a className="button primary" href="/about">Join Bigthink Today <ArrowRight size={16}/></a></div></section>
      <section className="partners wrap"><b>Our Partners</b>{["Kenyatta University","Strathmore University","eMobilis","KAM","KEPSA","Ministry of Education","NITA"].map((p,i)=><span key={p} className={`partner-logo p${i}`}>{p}</span>)}</section>
    </main><SiteFooter/></>;
}
