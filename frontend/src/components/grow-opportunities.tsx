"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, Search } from "lucide-react";

type Listing = { id?: string; title: string; company: string; type: string; location: string; duration: string; description: string };
const sampleListings: Listing[] = [
  { title: "IT Support Intern", company: "ABC Company", type: "Internship", location: "Nairobi", duration: "6 months", description: "Support the IT team with user requests, device setup and day-to-day technical operations." },
  { title: "Research Assistant", company: "GreenTech Ltd", type: "Job", location: "Remote", duration: "Full time", description: "Help coordinate field research, organize findings and prepare clear project reports." },
  { title: "Marketing Intern", company: "XYZ Limited", type: "Internship", location: "Nairobi", duration: "3 months", description: "Support content planning, campaign research and community engagement." },
  { title: "Business Development Attachment", company: "Innovate Co", type: "Attachment", location: "Mombasa", duration: "3 months", description: "Build practical experience in customer research, partnerships and business operations." },
  { title: "Junior Procurement Officer", company: "Eastland Supplies", type: "Job", location: "Nairobi", duration: "Full time", description: "Assist with supplier records, quotation reviews and procurement documentation." },
  { title: "Finance Assistant Attachment", company: "Kibo Partners", type: "Attachment", location: "Kisumu", duration: "3 months", description: "Work alongside the finance team on reconciliations, records and monthly reporting." },
];
const types = ["All", "Job", "Internship", "Attachment"];
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function GrowOpportunities() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>(sampleListings);
  const [liveData, setLiveData] = useState(false);
  const [notice, setNotice] = useState("");
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [coverNote, setCoverNote] = useState("");
  const [pending, setPending] = useState(false);
  const [type, setType] = useState("All");
  const [query, setQuery] = useState("");
  const [preferenceLoaded,setPreferenceLoaded]=useState(false);
  useEffect(() => {
    fetch(`${apiUrl}/api/opportunities`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load live listings");
        const result = await response.json() as { opportunities: Array<{ id:string; title:string; organization:string; opportunity_type:string; location:string; duration:string; description:string }> };
        setListings(result.opportunities.map((item) => ({ id:item.id, title:item.title, company:item.organization, type:item.opportunity_type[0]!.toUpperCase()+item.opportunity_type.slice(1), location:item.location, duration:item.duration, description:item.description })));
        setLiveData(true);
      })
      .catch(() => setNotice("Showing example listings. Live opportunities will appear when the Bigthink API is connected."));
  }, []);
  useEffect(()=>{
    fetch(`${apiUrl}/api/candidates/me`,{credentials:"include"}).then(async(response)=>{
      if(!response.ok)return;
      const data=await response.json() as {profile?:{opportunityPreference:string}};
      if(data.profile?.opportunityPreference==="job")setType("Job");
      if(data.profile?.opportunityPreference==="attachment")setType("Attachment");
    }).catch(()=>undefined).finally(()=>setPreferenceLoaded(true));
  },[]);

  async function apply(opportunityId: string) {
    setPending(true);
    setNotice("");
    try {
      const response = await fetch(`${apiUrl}/api/opportunities/${opportunityId}/applications`, { method:"POST", headers:{"Content-Type":"application/json"}, credentials:"include", body:JSON.stringify({coverNote}) });
      const result = await response.json() as { error?:string; message?:string };
      if (response.status === 401) { router.push("/login"); return; }
      if (!response.ok) throw new Error(result.error ?? "Application could not be submitted.");
      setNotice(result.message ?? "Application submitted.");
      setApplyingTo(null);
      setCoverNote("");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Application could not be submitted."); }
    finally { setPending(false); }
  }

  const results = useMemo(() => listings.filter((item) => {
    const matchesType = type === "All" || item.type === type || (type === "Job" && item.type === "Internship");
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const content = `${item.title} ${item.company} ${item.type} ${item.location} ${item.duration} ${item.description}`.toLowerCase();
    return matchesType && words.every((word) => content.includes(word));
  }), [listings, type, query]);

  return <>
    <div className="grow-controls">
      <label className="grow-search"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by role, company or location" aria-label="Search opportunities"/></label>
      <div className="grow-filters" aria-label="Filter by opportunity type">{types.map((item) => <button type="button" key={item} aria-pressed={type === item} className={type === item ? "selected" : ""} onClick={() => setType(item)}>{item === "All" ? "All opportunities" : `${item}s`}</button>)}</div>
    </div>
    {preferenceLoaded&&type!=="All"&&<p className="grow-count">Showing your saved preference: {type==="Job"?"jobs and internships":type.toLowerCase()+"s"}.</p>}
    {notice && <p className="grow-count" role="status">{notice}</p>}
    {liveData && listings.length === 0 && <p className="grow-count">There are no published opportunities right now. Please check back soon.</p>}
    {!liveData && listings.length > 0 && <p className="grow-count">Example listings</p>}
    <p className="grow-count" aria-live="polite">Showing {results.length} {results.length === 1 ? "opportunity" : "opportunities"}</p>
    {results.length ? <div className="grow-listings">{results.map((item) => <article className="grow-listing" key={item.id ?? item.title}>
      <div className="grow-listing-top"><span className={`grow-badge ${item.type.toLowerCase()}`}>{item.type}</span><span>{item.duration}</span></div>
      <h3>{item.title}</h3><p className="grow-company">{item.company}</p><p className="grow-description">{item.description}</p>
      <div className="grow-listing-bottom"><span><MapPin size={14}/>{item.location}</span>{item.id ? <button type="button" onClick={()=>{setApplyingTo(applyingTo===item.id?null:item.id!);setNotice("")}}>Apply <ArrowRight size={14}/></button> : <a href="/contact">Enquire <ArrowRight size={14}/></a>}</div>
      {applyingTo===item.id && item.id && <div className="mt-4 grid gap-2"><label className="text-xs font-semibold" htmlFor={`cover-${item.id}`}>Why are you a good fit? (20–4,000 characters)</label><textarea id={`cover-${item.id}`} minLength={20} maxLength={4000} required rows={4} className="w-full rounded border border-slate-300 p-2 text-sm" value={coverNote} onChange={(event)=>setCoverNote(event.target.value)}/><button disabled={pending||coverNote.trim().length<20} className="button primary justify-center disabled:opacity-50" onClick={()=>void apply(item.id!)}>{pending?"Submitting…":"Submit application"}</button></div>}
    </article>)}</div> : <div className="no-results"><h3>No opportunities match those filters</h3><p>Try a different search term or choose another opportunity type.</p></div>}
  </>;
}
