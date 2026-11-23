"use client";

import { useEffect, useState } from "react";
import { ChevronRight, MapPin } from "lucide-react";

type Opportunity = {
  initials: string;
  title: string;
  org: string;
  type: "Job" | "Internship" | "Attachment";
  place: string;
  time: string;
  color: string;
};

const filters = ["All", "Job", "Internship", "Attachment"] as const;
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function OpportunityList({ items }: { items: readonly Opportunity[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([...items]);
  const [liveData,setLiveData]=useState(false);
  useEffect(() => {
    fetch(`${apiUrl}/api/opportunities`).then(async (response) => {
      if (!response.ok) return;
      const result = await response.json() as { opportunities:Array<{id:string;title:string;organization:string;opportunity_type:"job"|"internship"|"attachment";location:string}> };
      setOpportunities(result.opportunities.map((item) => ({ initials:item.organization.slice(0,3).toUpperCase(), title:item.title, org:item.organization, type:(item.opportunity_type[0]!.toUpperCase()+item.opportunity_type.slice(1)) as Opportunity["type"], place:item.location, time:"Open", color:"green" })));
      setLiveData(true);
    }).catch(() => undefined);
  }, [items]);
  const visibleItems = filter === "All" ? opportunities : opportunities.filter((item) => item.type === filter);

  return <>
    {!liveData&&opportunities.length>0&&<p className="mb-2 text-[10px] text-slate-500">Example listings</p>}
    <div className="opportunity-filters" aria-label="Filter opportunities">
      {filters.map((item) => <button key={item} type="button" aria-pressed={filter === item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{item === "All" ? "All opportunities" : `${item}s`}</button>)}
    </div>
    <div aria-live="polite">
      {visibleItems.length ? visibleItems.map((o) => <a className="opportunity" href="/grow" key={`${o.org}-${o.title}`}>
        <span className={`org-mark ${o.color}`}>{o.initials}</span><span className="opp-name"><b>{o.title}</b><small>{o.org}</small></span>
        <span className={`pill ${o.color}`}>{o.type}</span><span className="opp-place"><MapPin size={14}/>{o.place}</span><small className="opp-time">{o.time}</small><ChevronRight size={17}/>
      </a>) : <p className="empty-filter">No {filter.toLowerCase()} listings yet.</p>}
    </div>
  </>;
}
