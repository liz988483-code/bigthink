import { SiteHeader, SiteFooter } from "@/components/site";
import { ConnectPrograms } from "@/components/connect-programs";
import { UpcomingEvents } from "@/components/upcoming-events";
import { ArrowRight, CalendarCheck, MailCheck, TicketCheck, UsersRound } from "lucide-react";

const steps = [
  { icon: CalendarCheck, title: "Explore", text: "Browse Bigthink event programmes and find a topic that interests you." },
  { icon: TicketCheck, title: "Register", text: "When a specific event is announced, review its details and registration terms." },
  { icon: MailCheck, title: "Get updates", text: "Receive event information and reminders through Bigthink communications." },
  { icon: UsersRound, title: "Connect", text: "Meet peers, employers, suppliers and professionals in your community." },
];

export default function ConnectPage() {
  return <><SiteHeader active="Connect"/><main>
    <section className="subhero connect"><div className="subhero-img" style={{backgroundImage:"url(https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1800&q=85)"}}/><div className="subhero-overlay"/><div className="wrap subhero-content"><p className="eyebrow light">CONNECT · EVENTS & NETWORKING</p><h1>Make Meaningful Connections</h1><p>Discover events and learning programmes that bring people, ideas and opportunities together.</p><a href="#programmes" className="button primary">Explore Programmes <ArrowRight size={15}/></a></div></section>
    <section className="wrap connect-intro"><p className="eyebrow">A PLACE TO MEET, LEARN AND GROW</p><h2>Good connections can create new opportunities.</h2><p>Bigthink Connect brings together students, professionals, employers, suppliers and business communities through events, workshops and networking.</p></section>
    <section className="wrap connect-directory"><div className="grow-section-heading"><div><p className="eyebrow">DATES & REGISTRATION</p><h2>Upcoming events</h2><p>Register for a published event using your Bigthink account.</p></div></div><UpcomingEvents/></section>
    <section className="wrap connect-directory" id="programmes"><div className="grow-section-heading"><div><p className="eyebrow">FIND YOUR COMMUNITY</p><h2>Explore event programmes</h2><p>Browse the kinds of events Bigthink Connect is developing. Specific event dates and registration details will be published when confirmed.</p></div></div><ConnectPrograms/></section>
    <section className="grow-how connect-how"><div className="wrap"><p className="eyebrow">FROM DISCOVERY TO CONNECTION</p><h2>How event participation works</h2><div className="grow-steps">{steps.map(({icon:Icon,title,text},index)=><article className="grow-step" key={title}><span className="grow-step-number">{index+1}</span><span className="grow-step-icon"><Icon size={20}/></span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
    <section className="wrap connect-host"><div><p className="eyebrow">FOR ORGANIZERS & PARTNERS</p><h2>Bring your community together.</h2><p>Partner with Bigthink to host a career forum, research workshop, supplier meetup or business event.</p></div><a className="button primary" href="/contact">Discuss an event <ArrowRight size={15}/></a></section>
  </main><SiteFooter/></>;
}
