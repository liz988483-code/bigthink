import { SiteHeader, SiteFooter } from "@/components/site";
import { ArrowRight, Search } from "lucide-react";

const searchIndex = [
  { title: "Research support", category: "Think", description: "Academic and professional research guidance, editing and data analysis.", href: "/think", terms: "research academic thesis data analysis editing knowledge" },
  { title: "Jobs and internships", category: "Grow", description: "Explore job opportunities, internships, attachments and career support.", href: "/grow", terms: "job jobs internship internships attachment career opportunity grow" },
  { title: "Supplier and buyer network", category: "Build", description: "Find suppliers, buyers, logistics providers and procurement support.", href: "/build", terms: "supplier suppliers buyer procurement logistics sourcing build business" },
  { title: "Events and networking", category: "Connect", description: "Discover professional events, workshops, forums and meetups.", href: "/connect", terms: "event events networking workshop forum meetup connect" },
  { title: "Bigthink insights", category: "Insights", description: "Read ideas and practical guides on research, careers, business and procurement.", href: "/insights", terms: "insights articles guides research careers business procurement" },
  { title: "About Bigthink", category: "About", description: "Learn about Bigthink’s vision, mission and values.", href: "/about", terms: "about vision mission values people knowledge" },
];

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const normalized = query.toLocaleLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean);
  let liveItems: typeof searchIndex = [];
  if (words.length) {
    const apiUrl=process.env.NEXT_PUBLIC_API_URL??"http://localhost:4000";
    try {
      const [opportunityResponse,eventResponse]=await Promise.all([
        fetch(`${apiUrl}/api/opportunities`,{cache:"no-store",signal:AbortSignal.timeout(1500)}),
        fetch(`${apiUrl}/api/events`,{cache:"no-store",signal:AbortSignal.timeout(1500)}),
      ]);
      const opportunities=opportunityResponse.ok?await opportunityResponse.json() as {opportunities:Array<{title:string;organization:string;opportunity_type:string;location:string;description:string}>}:{opportunities:[]};
      const events=eventResponse.ok?await eventResponse.json() as {events:Array<{title:string;category:string;venue:string;starts_at:string;description:string}>}:{events:[]};
      liveItems=[
        ...opportunities.opportunities.map((item)=>({title:item.title,category:"Opportunity",description:`${item.opportunity_type} at ${item.organization} · ${item.location}. ${item.description}`,href:"/grow",terms:`${item.title} ${item.organization} ${item.opportunity_type} ${item.location}`})),
        ...events.events.map((item)=>({title:item.title,category:"Event",description:`${item.category} · ${item.venue} · ${new Date(item.starts_at).toLocaleDateString()}. ${item.description}`,href:"/connect",terms:`${item.title} ${item.category} ${item.venue}`})),
      ];
    } catch {
      // The public page index remains searchable while the local API is offline.
    }
  }
  const results = words.length ? [...searchIndex,...liveItems].filter((item) => {
    const content=`${item.title} ${item.category} ${item.description} ${item.terms}`.toLocaleLowerCase();
    return words.every((word)=>content.includes(word));
  }) : [];

  return <><SiteHeader active=""/><main className="search-page wrap">
    <p className="eyebrow">FIND YOUR NEXT STEP</p><h1>Search Bigthink</h1><p className="search-intro">Search services, opportunities, events and insights across Bigthink.</p>
    <form action="/search" className="results-search"><input name="q" defaultValue={query} aria-label="Search Bigthink" placeholder="Try “internship”, “research” or “suppliers”"/><button className="button primary" type="submit"><Search size={17}/>Search</button></form>
    {query ? <><h2 className="results-title">{results.length} {results.length === 1 ? "result" : "results"} for “{query}”</h2>{results.length ? <div className="search-results">{results.map((item) => <article className="search-result" key={item.title}><span>{item.category}</span><h3>{item.title}</h3><p>{item.description}</p><a href={item.href}>Explore {item.category} <ArrowRight size={14}/></a></article>)}</div> : <div className="no-results"><h2>No matching pages found</h2><p>Try a broader term such as careers, research, events or suppliers.</p></div>}</> : <div className="search-suggestions"><h2>Popular searches</h2>{["Jobs", "Internships", "Research support", "Suppliers", "Events"].map((term) => <a key={term} href={`/search?q=${encodeURIComponent(term)}`}>{term}</a>)}</div>}
  </main><SiteFooter/></>;
}
