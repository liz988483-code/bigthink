"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site";

type Account = { id:string; fullName:string; email:string; role:string; createdAt?:string };
type Application = { id:string; status:string; candidate_name?:string; candidate_email?:string; opportunity_id?:string; opportunity_title?:string; title?:string; organization?:string; opportunity_type?:string; location?:string; applied_at?:string; cover_note?:string };
type Registration = { id:string; status:string; event_id:string; title:string; venue:string; starts_at:string };
type ManagedOpportunity = { id:string; title:string; organization:string; opportunity_type:string; location:string; status:string; created_at:string };
type SupplierProfile = { business_name?:string;category?:string;description?:string;location?:string;website?:string|null;verification_status?:string };
type BuyerRequest = { id:string;title:string;category:string;description:string;quantity:string;delivery_location:string;status:string;response_count:number };
type SupplierRequest = { id:string;title:string;category:string;description:string;quantity:string;delivery_location:string };
type SupplierResponse = { id:string;request_id:string;request_title:string;message:string;status:string;delivery_location:string };
type ThreadMessage = { id:string;sender_id:string;sender_name:string;message:string;created_at:string };
type PendingSupplier = { id:string;business_name:string;category:string;description:string;location:string;full_name:string;email:string };
type DraftArticle = { id:string;title:string;category:string;summary:string;status:string };
type ManagedEvent = { id:string;title:string;category:string;venue:string;starts_at:string;status:string;registered_count:number;capacity:number|null };
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function ConversationThread({requestId,supplierId}:{requestId:string;supplierId:string}) {
  const [messages,setMessages]=useState<ThreadMessage[]>([]);
  const [notice,setNotice]=useState("");
  const endpoint=`${apiUrl}/api/marketplace/requests/${requestId}/conversations/${supplierId}`;
  const refresh=useCallback(async()=>{const response=await fetch(endpoint,{credentials:"include"});if(response.ok){const data=await response.json() as {messages:ThreadMessage[]};setMessages(data.messages);}},[endpoint]);
  useEffect(()=>{void refresh();},[refresh]);
  async function send(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=event.currentTarget;const message=String(new FormData(form).get("message")??"");const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({message})});const result=await response.json() as {error?:string};if(!response.ok){setNotice(result.error??"Could not send message.");return;}form.reset();setNotice("");await refresh();}
  return <div className="mt-3 border-t pt-3"><p className="text-sm font-semibold">Conversation</p><div className="mt-2 max-h-44 space-y-2 overflow-y-auto">{messages.length===0?<p className="text-xs text-slate-500">Start a conversation about this request.</p>:messages.map((item)=><p key={item.id} className="rounded bg-white p-2 text-sm"><b>{item.sender_name}: </b>{item.message}</p>)}</div><form onSubmit={(event)=>void send(event)} className="mt-2 flex gap-2"><input name="message" required maxLength={4000} className="min-w-0 flex-1 rounded border px-3 py-2 text-sm" placeholder="Write a message"/><button className="rounded bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Send</button></form>{notice&&<p role="alert" className="mt-1 text-xs text-red-700">{notice}</p>}</div>;
}

function CandidateDashboard({applications}:{applications:Application[]}) {
  const [skills,setSkills]=useState("");
  const [capabilities,setCapabilities]=useState("");
  const [preference,setPreference]=useState("both");
  const [resumeName,setResumeName]=useState("");
  const [profileMessage,setProfileMessage]=useState("");
  const [savingProfile,setSavingProfile]=useState(false);
  const metrics = [
    { label:"Applications", value:applications.length },
    { label:"In progress", value:applications.filter((item)=>!["declined","hired"].includes(item.status)).length },
    { label:"Shortlisted", value:applications.filter((item)=>item.status==="shortlisted").length },
  ];

  useEffect(()=>{
    const heading=[...document.querySelectorAll("h2")].find((item)=>item.textContent==="My applications");
    heading?.closest("section")?.setAttribute("id","candidate-applications");
    fetch(`${apiUrl}/api/candidates/me`,{credentials:"include"}).then(async(response)=>{
      if(!response.ok)return;
      const data=await response.json() as {profile?:{skills:string[];capabilitySummary:string;opportunityPreference:string;resumeName:string|null}};
      if(data.profile){setSkills(data.profile.skills.join(", "));setCapabilities(data.profile.capabilitySummary);setPreference(data.profile.opportunityPreference);setResumeName(data.profile.resumeName??"");}
    }).catch(()=>undefined);
  },[]);

  async function saveCandidateProfile(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setSavingProfile(true);setProfileMessage("");
    try{
      const response=await fetch(`${apiUrl}/api/candidates/me`,{method:"PUT",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({skills:skills.split(",").map((skill)=>skill.trim()).filter(Boolean),capabilitySummary:capabilities,opportunityPreference:preference})});
      const result=await response.json() as {message?:string;error?:string};if(!response.ok)throw new Error(result.error??"Could not save your profile.");setProfileMessage(result.message??"Profile saved.");
    }catch(error){setProfileMessage(error instanceof Error?error.message:"Could not save your profile.");}finally{setSavingProfile(false);}
  }

  async function uploadResume(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const form=event.currentTarget;const file=(new FormData(form).get("resume")) as File|null;if(!file||!file.size)return;
    setSavingProfile(true);setProfileMessage("");
    try{
      const response=await fetch(`${apiUrl}/api/candidates/me/resume`,{method:"PUT",headers:{"Content-Type":file.type,"X-File-Name":encodeURIComponent(file.name)},credentials:"include",body:file});
      const result=await response.json() as {message?:string;resumeName?:string;error?:string};if(!response.ok)throw new Error(result.error??"Could not upload this file.");setResumeName(result.resumeName??file.name);setProfileMessage(result.message??"File uploaded.");form.reset();
    }catch(error){setProfileMessage(error instanceof Error?error.message:"Could not upload this file.");}finally{setSavingProfile(false);}
  }

  return <section className="mt-5 grid overflow-hidden rounded-lg border border-slate-200 bg-white lg:min-h-[680px] lg:grid-cols-[220px_1fr]">
    <aside className="border-b border-slate-200 bg-white p-4 lg:border-b-0 lg:border-r"><Link href="/" className="text-2xl font-extrabold text-blue-950">Bigthink<span className="text-emerald-600">●</span></Link><p className="mb-5 text-[10px] text-slate-500">Ideas. People. Impact.</p><nav aria-label="Candidate dashboard" className="grid gap-1 text-sm">{[["Dashboard","#candidate-overview"],["My Profile","/contact"],["Career Assessment","/contact"],["Learning & Skills","/contact"],["Mentorship","/contact"],["Opportunities","/grow#opportunities"],["Applications","#candidate-applications"],["Interview Prep","/contact"],["Messages","/contact"],["My Progress","#candidate-overview"],["Settings","/account"]].map(([label,href],i)=><Link key={label} href={href} className={`rounded-md px-3 py-2.5 ${i===0?"bg-emerald-50 font-bold text-emerald-700":"text-slate-600 hover:bg-slate-50"}`}>{label}</Link>)}</nav><div className="mt-6 rounded-md bg-emerald-50 p-3"><p className="text-sm font-bold text-emerald-800">Need help?</p><p className="mt-1 text-xs text-slate-600">Talk to a career advisor.</p><Link href="/contact" className="mt-3 block rounded bg-emerald-700 px-3 py-2 text-center text-xs font-bold text-white">Book a session</Link></div></aside>
    <div className="min-w-0 bg-slate-50"><header className="flex h-14 items-center justify-between border-b bg-white px-5"><span className="text-sm font-semibold text-slate-700">Grow / Candidate dashboard</span><Link href="/account" className="text-sm font-semibold text-slate-600">Account</Link></header><div className="space-y-4 p-4 md:p-6">
      <div className="relative flex min-h-44 items-center overflow-hidden rounded-md bg-emerald-50"><img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1100&q=80" alt="Professionals collaborating" className="absolute inset-0 h-full w-full object-cover object-center"/><div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/10"/><div className="relative z-10 max-w-lg p-5"><h1 className="text-2xl font-bold text-slate-950">Welcome back!</h1><p className="mt-1 text-sm text-slate-600">You’re on your way to a brighter future. Keep building your skills and exploring opportunities.</p><Link href="/grow#opportunities" className="mt-3 inline-flex rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white">Continue exploring</Link></div></div>
      <div id="candidate-overview" className="grid gap-3 sm:grid-cols-3">{metrics.map((metric)=><article key={metric.label} className="rounded-md border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">{metric.label}</p><strong className="mt-1 block text-2xl text-slate-900">{metric.value}</strong></article>)}</div>
      <div className="rounded-md border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="font-bold">Career readiness progress</h2><Link href="/contact" className="text-xs font-semibold text-blue-700">Get support</Link></div><div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs sm:grid-cols-6">{["Profile","Assessment","Learning","Mentorship","Job readiness","Placement"].map((label,i)=><div key={label}><span className={`mx-auto grid size-7 place-items-center rounded-full font-bold text-white ${i<2?"bg-emerald-600":"bg-slate-300"}`}>{i+1}</span><span className="mt-2 block text-slate-600">{label}</span></div>)}</div></div>
      <div className="grid gap-4 md:grid-cols-2"><article className="rounded-md border border-slate-200 bg-white p-5"><h2 className="font-bold">Recommended for you</h2><p className="mt-2 text-sm text-slate-600">Get career coaching, update your CV, and build interview skills.</p><Link href="/contact" className="mt-3 inline-flex rounded border px-3 py-2 text-sm font-semibold">View career support</Link></article><article className="rounded-md border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="font-bold">Latest opportunities</h2><Link href="/grow#opportunities" className="text-xs font-semibold text-blue-700">View all</Link></div><p className="mt-2 text-sm text-slate-600">Browse current jobs, internships and attachments.</p><Link href="/grow#opportunities" className="mt-3 inline-flex rounded-md bg-emerald-600 px-3 py-2 text-sm font-bold text-white">Browse and apply</Link></article></div>
      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]"><form onSubmit={saveCandidateProfile} className="rounded-md border border-slate-200 bg-white p-5"><h2 className="font-bold">My skills and capabilities</h2><p className="mt-1 text-sm text-slate-500">List your skills, tools, training and the work you can do.</p><label className="mt-4 block text-sm font-semibold">Skills, separated by commas<textarea value={skills} onChange={(event)=>setSkills(event.target.value)} rows={2} maxLength={3200} className="mt-1 w-full rounded border border-slate-300 p-3 text-sm" placeholder="Customer service, Excel, accounting"/></label><label className="mt-3 block text-sm font-semibold">What are you capable of?<textarea value={capabilities} onChange={(event)=>setCapabilities(event.target.value)} rows={3} maxLength={3000} className="mt-1 w-full rounded border border-slate-300 p-3 text-sm" placeholder="Describe projects, experience, and practical strengths"/></label><label className="mt-3 block text-sm font-semibold">I am looking for<select value={preference} onChange={(event)=>setPreference(event.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-white p-3 text-sm"><option value="both">Jobs and attachments</option><option value="job">Jobs</option><option value="attachment">Attachments</option></select></label><button disabled={savingProfile} className="mt-4 rounded bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white">{savingProfile?"Saving…":"Save skills profile"}</button></form><div className="rounded-md border border-slate-200 bg-white p-5"><h2 className="font-bold">Upload your work</h2><p className="mt-1 text-sm text-slate-500">Add a CV, certificate, or portfolio document (PDF, JPG or PNG, up to 4 MB).</p>{resumeName&&<p className="mt-3 text-sm font-semibold text-emerald-700">Uploaded: {resumeName} · <a href={`${apiUrl}/api/candidates/me/resume`} className="underline" target="_blank">Download</a></p>}<form onSubmit={(event)=>void uploadResume(event)} className="mt-4 grid gap-3"><input required type="file" name="resume" accept="application/pdf,image/jpeg,image/png" className="w-full text-sm"/><button disabled={savingProfile} className="justify-self-start rounded border border-emerald-700 px-4 py-2.5 text-sm font-bold text-emerald-700">Upload file</button></form>{profileMessage&&<p role="status" className="mt-3 text-sm text-slate-700">{profileMessage}</p>}</div></div>
    </div></div>
  </section>;
}

function EmployerDashboard({opportunities,applications}:{opportunities:ManagedOpportunity[];applications:Application[]}) {
  const metrics = [
    { label:"Active opportunities", value:opportunities.filter((item)=>item.status==="published").length },
    { label:"Total applications", value:applications.length },
    { label:"Shortlisted", value:applications.filter((item)=>item.status==="shortlisted").length },
    { label:"To review", value:applications.filter((item)=>item.status==="new").length },
  ];

  useEffect(()=>{
    const titleInput=document.querySelector<HTMLInputElement>('form input[name="title"]');
    titleInput?.closest("form")?.setAttribute("id","post-opportunity");
  },[]);

  return <section className="mt-5 grid overflow-hidden rounded-lg border border-slate-200 bg-white lg:min-h-[680px] lg:grid-cols-[220px_1fr]">
    <aside className="border-b border-slate-200 bg-white p-4 lg:border-b-0 lg:border-r"><Link href="/" className="text-2xl font-extrabold text-blue-950">Bigthink<span className="text-emerald-600">●</span></Link><p className="mb-5 text-[10px] text-slate-500">Ideas. People. Impact.</p><nav aria-label="Employer dashboard" className="grid gap-1 text-sm">{[["Dashboard","#employer-overview"],["Company Profile","/contact"],["Post Opportunity","#post-opportunity"],["Manage Opportunities","#employer-listings"],["Browse Candidates","/grow"],["Shortlisted Candidates","#employer-applications"],["Interviews","#employer-applications"],["Hired / Placed","#employer-applications"],["Messages","/contact"],["Reports","#employer-overview"],["Settings","/account"]].map(([label,href],i)=><Link key={label} href={href} className={`rounded-md px-3 py-2.5 ${i===0?"bg-blue-50 font-bold text-blue-700":"text-slate-600 hover:bg-slate-50"}`}>{label}</Link>)}</nav><div className="mt-6 rounded-md bg-blue-50 p-3"><p className="text-sm font-bold text-blue-800">Recruitment support</p><p className="mt-1 text-xs text-slate-600">Need help finding the right talent?</p><Link href="/contact" className="mt-3 block rounded border border-blue-300 px-3 py-2 text-center text-xs font-bold text-blue-700">Contact support</Link></div></aside>
    <div className="min-w-0 bg-slate-50"><header className="flex h-14 items-center justify-between border-b bg-white px-5"><span className="text-sm font-semibold text-slate-700">Grow / Employer portal</span><a href="#post-opportunity" className="rounded bg-blue-700 px-3 py-2 text-xs font-bold text-white">+ Post new opportunity</a></header><div className="space-y-4 p-4 md:p-6">
      <div className="relative flex min-h-44 items-center overflow-hidden rounded-md bg-blue-50"><img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1100&q=80" alt="A team working together" className="absolute inset-0 h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/10"/><div className="relative z-10 max-w-lg p-5"><h1 className="text-2xl font-bold text-slate-950">Welcome back!</h1><p className="mt-1 text-sm text-slate-600">Find, mentor and hire top talent with Bigthink.</p><a href="#post-opportunity" className="mt-3 inline-flex rounded-md bg-blue-700 px-4 py-2.5 text-sm font-bold text-white">+ Post a new opportunity</a></div></div>
      <div id="employer-overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric)=><article key={metric.label} className="rounded-md border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">{metric.label}</p><strong className="mt-1 block text-2xl text-slate-900">{metric.value}</strong></article>)}</div>
      <div className="grid gap-4 xl:grid-cols-2"><article id="employer-applications" className="rounded-md border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="font-bold">Recent applications</h2><a href="#employer-applications" className="text-xs font-semibold text-blue-700">View all</a></div>{applications.length===0?<p className="mt-3 text-sm text-slate-500">Candidate applications will appear here.</p>:applications.slice(0,5).map((item)=><div key={item.id} className="mt-3 flex items-center justify-between gap-2 border-t pt-3"><div><p className="font-semibold">{item.candidate_name}</p><p className="text-xs text-slate-500">{item.opportunity_title}</p></div><span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold capitalize text-blue-700">{item.status}</span></div>)}</article><article id="employer-listings" className="rounded-md border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="font-bold">Active opportunities</h2><a href="#post-opportunity" className="text-xs font-semibold text-blue-700">Manage</a></div>{opportunities.filter((item)=>item.status==="published").length===0?<p className="mt-3 text-sm text-slate-500">Your published listings will appear here.</p>:opportunities.filter((item)=>item.status==="published").slice(0,5).map((item)=><div key={item.id} className="mt-3 flex justify-between gap-2 border-t pt-3"><div><p className="font-semibold">{item.title}</p><p className="text-xs text-slate-500">{item.location} · {item.opportunity_type}</p></div><span className="text-xs font-semibold text-emerald-700">Published</span></div>)}</article></div>
    </div></div>
  </section>;
}

export default function AccountPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account|null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [opportunities, setOpportunities] = useState<ManagedOpportunity[]>([]);
  const [supplierProfile, setSupplierProfile] = useState<SupplierProfile|null>(null);
  const [buyerRequests, setBuyerRequests] = useState<BuyerRequest[]>([]);
  const [supplierRequests, setSupplierRequests] = useState<SupplierRequest[]>([]);
  const [supplierResponses,setSupplierResponses]=useState<SupplierResponse[]>([]);
  const [pendingSuppliers,setPendingSuppliers]=useState<PendingSupplier[]>([]);
  const [draftArticles,setDraftArticles]=useState<DraftArticle[]>([]);
  const [managedEvents,setManagedEvents]=useState<ManagedEvent[]>([]);
  const [eventRosters,setEventRosters]=useState<Record<string,Array<{id:string;full_name:string;email:string;role:string}>>>({});
  const [replies, setReplies] = useState<Record<string,Array<{id:string;supplier_id:string;business_name:string;category:string;message:string}>>>({});
  const [expandedRequest, setExpandedRequest] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`${apiUrl}/api/auth/me`, { credentials:"include" });
    if (!response.ok) { router.replace("/login"); return; }
    const { user } = await response.json() as { user:Account };
    setAccount(user);
    const calls:Promise<void>[] = [
      fetch(`${apiUrl}/api/events/mine/registrations`,{credentials:"include"}).then(async (r)=>{if(r.ok){const d=await r.json() as {registrations:Registration[]};setRegistrations(d.registrations);}}),
    ];
    if (user.role === "candidate") calls.push(fetch(`${apiUrl}/api/opportunities/mine/applications`,{credentials:"include"}).then(async(r)=>{if(r.ok){const d=await r.json() as {applications:Application[]};setApplications(d.applications);}}));
    if (user.role === "employer"||user.role === "talent_admin"||user.role === "super_admin") {
      calls.push(fetch(`${apiUrl}/api/opportunities/managed`,{credentials:"include"}).then(async(r)=>{if(r.ok){const d=await r.json() as {opportunities:ManagedOpportunity[]};setOpportunities(d.opportunities);}}));
      calls.push(fetch(`${apiUrl}/api/opportunities/managed/applications`,{credentials:"include"}).then(async(r)=>{if(r.ok){const d=await r.json() as {applications:Application[]};setApplications(d.applications);}}));
    }
    if(user.role==="supplier"||user.role==="skilled_provider"){
      calls.push(fetch(`${apiUrl}/api/marketplace/suppliers/mine`,{credentials:"include"}).then(async(r)=>{if(r.ok){const d=await r.json() as {profile:SupplierProfile|null};setSupplierProfile(d.profile);}}));
      calls.push(fetch(`${apiUrl}/api/marketplace/requests/open`,{credentials:"include"}).then(async(r)=>{if(r.ok){const d=await r.json() as {requests:SupplierRequest[]};setSupplierRequests(d.requests);}}));
      calls.push(fetch(`${apiUrl}/api/marketplace/responses/mine`,{credentials:"include"}).then(async(r)=>{if(r.ok){const d=await r.json() as {responses:SupplierResponse[]};setSupplierResponses(d.responses);}}));
    }
    if(user.role==="buyer")calls.push(fetch(`${apiUrl}/api/marketplace/requests/mine`,{credentials:"include"}).then(async(r)=>{if(r.ok){const d=await r.json() as {requests:BuyerRequest[]};setBuyerRequests(d.requests);}}));
    if(user.role==="verification_officer"||user.role==="super_admin")calls.push(fetch(`${apiUrl}/api/marketplace/suppliers/pending`,{credentials:"include"}).then(async(r)=>{if(r.ok){const d=await r.json() as {suppliers:PendingSupplier[]};setPendingSuppliers(d.suppliers);}}));
    if(user.role==="content_editor"||user.role==="super_admin")calls.push(fetch(`${apiUrl}/api/insights/mine`,{credentials:"include"}).then(async(r)=>{if(r.ok){const d=await r.json() as {articles:DraftArticle[]};setDraftArticles(d.articles);}}));
    if(user.role==="events_admin"||user.role==="super_admin")calls.push(fetch(`${apiUrl}/api/events/managed`,{credentials:"include"}).then(async(r)=>{if(r.ok){const d=await r.json() as {events:ManagedEvent[]};setManagedEvents(d.events);}}));
    await Promise.all(calls);
  },[router]);

  useEffect(()=>{load().catch(()=>setMessage("Could not load your account data.")).finally(()=>setLoading(false));},[load]);

  async function submitOpportunity(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setMessage("");
    const formElement=event.currentTarget;
    const body=Object.fromEntries(new FormData(formElement).entries());if(!body.applicationDeadline)delete body.applicationDeadline;
    try {
      const response=await fetch(`${apiUrl}/api/opportunities`,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify(body)});
      const result=await response.json() as {id?:string;error?:string};
      if(!response.ok||!result.id)throw new Error(result.error??"Could not create opportunity.");
      const publish=await fetch(`${apiUrl}/api/opportunities/${result.id}/publish`,{method:"PATCH",credentials:"include"});
      if(!publish.ok)throw new Error("The opportunity was saved as a draft, but could not be published.");
      setMessage("Opportunity published and visible to candidates.");formElement.reset();await load();
    }catch(error){setMessage(error instanceof Error?error.message:"Could not save opportunity.");}
    finally{setBusy(false);}
  }

  async function submitEvent(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setMessage("");
    const formElement=event.currentTarget;
    const form=Object.fromEntries(new FormData(formElement).entries());
    const body={...form,capacity:form.capacity?Number(form.capacity):null,startsAt:new Date(String(form.startsAt)).toISOString()};
    try {
      const response=await fetch(`${apiUrl}/api/events`,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify(body)});
      const result=await response.json() as {id?:string;error?:string};
      if(!response.ok||!result.id)throw new Error(result.error??"Could not create event.");
      const publish=await fetch(`${apiUrl}/api/events/${result.id}/publish`,{method:"PATCH",credentials:"include"});
      if(!publish.ok)throw new Error("The event was saved as a draft, but could not be published.");
      setMessage("Event published and open for registration.");formElement.reset();await load();
    }catch(error){setMessage(error instanceof Error?error.message:"Could not save event.");}
    finally{setBusy(false);}
  }

  async function saveSupplierProfile(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage("");const body=Object.fromEntries(new FormData(event.currentTarget).entries());
    try{const response=await fetch(`${apiUrl}/api/marketplace/suppliers/mine`,{method:"PUT",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify(body)});const result=await response.json() as {error?:string;message?:string};if(!response.ok)throw new Error(result.error??"Could not save profile.");setMessage(result.message??"Profile saved for review.");await load();}catch(error){setMessage(error instanceof Error?error.message:"Could not save profile.");}finally{setBusy(false);}
  }

  async function submitBuyerRequest(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage("");const formElement=event.currentTarget;const body=Object.fromEntries(new FormData(formElement).entries());if(!body.dueDate)delete body.dueDate;
    try{const response=await fetch(`${apiUrl}/api/marketplace/requests`,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify(body)});const result=await response.json() as {error?:string;message?:string};if(!response.ok)throw new Error(result.error??"Could not send request.");setMessage(result.message??"Request published.");formElement.reset();await load();}catch(error){setMessage(error instanceof Error?error.message:"Could not send request.");}finally{setBusy(false);}
  }

  async function respondToBuyerRequest(event:FormEvent<HTMLFormElement>,requestId:string){
    event.preventDefault();setBusy(true);setMessage("");const form=event.currentTarget;const body=Object.fromEntries(new FormData(form).entries());
    try{const response=await fetch(`${apiUrl}/api/marketplace/requests/${requestId}/responses`,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify(body)});const result=await response.json() as {error?:string;message?:string};if(!response.ok)throw new Error(result.error??"Could not send offer.");setMessage(result.message??"Offer sent.");form.reset();}catch(error){setMessage(error instanceof Error?error.message:"Could not send offer.");}finally{setBusy(false);}
  }

  async function showBuyerResponses(requestId:string){
    if(expandedRequest===requestId){setExpandedRequest("");return;}
    const response=await fetch(`${apiUrl}/api/marketplace/requests/${requestId}/responses`,{credentials:"include"});
    if(response.ok){const result=await response.json() as {responses:Array<{id:string;supplier_id:string;business_name:string;category:string;message:string}>};setReplies((current)=>({...current,[requestId]:result.responses}));setExpandedRequest(requestId);}
  }

  async function reviewSupplier(profileId:string,status:"verified"|"rejected"){
    const response=await fetch(`${apiUrl}/api/marketplace/suppliers/${profileId}/verification`,{method:"PATCH",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({status})});
    if(response.ok){setPendingSuppliers((current)=>current.filter((item)=>item.id!==profileId));setMessage(`Supplier profile ${status}.`);}
  }

  async function viewEventRoster(eventId:string){
    const response=await fetch(`${apiUrl}/api/events/managed/${eventId}/registrations`,{credentials:"include"});
    if(response.ok){const result=await response.json() as {registrations:Array<{id:string;full_name:string;email:string;role:string}>};setEventRosters((current)=>({...current,[eventId]:result.registrations}));}
  }

  async function submitArticle(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage("");const formElement=event.currentTarget;const body=Object.fromEntries(new FormData(formElement).entries());if(!body.coverImage)delete body.coverImage;
    try{const response=await fetch(`${apiUrl}/api/insights`,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify(body)});const result=await response.json() as {id?:string;error?:string};if(!response.ok||!result.id)throw new Error(result.error??"Could not save article.");const published=await fetch(`${apiUrl}/api/insights/${result.id}/publish`,{method:"PATCH",credentials:"include"});if(!published.ok)throw new Error("Article saved as a draft, but could not be published.");setMessage("Insight published.");formElement.reset();await load();}catch(error){setMessage(error instanceof Error?error.message:"Could not publish insight.");}finally{setBusy(false);}
  }

  async function changeApplicationStatus(id:string,status:"reviewing"|"shortlisted"|"declined") {
    const response=await fetch(`${apiUrl}/api/opportunities/applications/${id}/status`,{method:"PATCH",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({status})});
    const result=await response.json() as {error?:string};
    if(!response.ok){setMessage(result.error??"Could not update application.");return;}
    setApplications((current)=>current.map((item)=>item.id===id?{...item,status}:item));
  }

  async function cancelRegistration(id:string) {
    const response=await fetch(`${apiUrl}/api/events/${id}/registrations/me`,{method:"DELETE",credentials:"include"});
    if(response.ok)setRegistrations((current)=>current.filter((item)=>item.event_id!==id));
  }

  async function logout(){await fetch(`${apiUrl}/api/auth/logout`,{method:"POST",credentials:"include"});router.replace("/login");}
  const field="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-emerald-600";

  const isGrowAccount = account?.role === "candidate" || account?.role === "employer" || account?.role === "talent_admin";

  return <><SiteHeader active=""/><main className={`mx-auto min-h-[65vh] px-5 py-12 ${isGrowAccount ? "max-w-7xl" : "max-w-5xl"}`}>
    {loading&&<p className="text-slate-600">Loading your account…</p>}
    {!loading&&account&&<>
      <div className={`rounded-lg border p-6 md:p-8 ${account.role==="candidate"?"border-emerald-100 bg-emerald-50":"border-blue-100 bg-blue-50"}`}><p className={`mb-2 text-xs font-bold uppercase tracking-[.16em] ${account.role==="candidate"?"text-emerald-700":"text-blue-700"}`}>Grow · {account.role.replaceAll("_"," ")} portal</p><div className="flex flex-wrap items-end justify-between gap-5"><div><h1 className="text-3xl font-bold text-slate-950">Welcome back, {account.fullName}!</h1><p className="mt-2 text-slate-600">{account.role==="candidate"?"Keep building your skills and find your next opportunity.":"Connect with talent and manage your opportunities on Bigthink."}</p><p className="mt-1 text-sm text-slate-500">{account.email}</p></div><Link href="/grow#opportunities" className="rounded-md bg-blue-700 px-4 py-3 text-sm font-semibold text-white">{account.role==="candidate"?"Explore opportunities":"Browse Grow"}</Link></div></div>
      {message&&<p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{message}</p>}
      {account.role==="candidate"&&<CandidateDashboard applications={applications}/>}
      {(account.role==="employer"||account.role==="talent_admin")&&<EmployerDashboard opportunities={opportunities} applications={applications}/>}
      {account.role==="buyer"&&expandedRequest&&<section className="mt-4 rounded-lg border border-slate-200 bg-white p-5"><h2 className="font-bold">Supplier conversations</h2>{(replies[expandedRequest]??[]).map((reply)=><article key={reply.id} className="mt-3 rounded-md bg-slate-50 p-4"><p className="font-semibold">{reply.business_name} · {reply.category}</p><p className="mt-1 text-sm text-slate-600">{reply.message}</p><ConversationThread requestId={expandedRequest} supplierId={reply.supplier_id}/></article>)}</section>}
      {(account.role==="supplier"||account.role==="skilled_provider")&&supplierResponses.length>0&&<section className="mt-5 rounded-lg border border-slate-200 bg-white p-5"><h2 className="font-bold">Buyer conversations</h2>{supplierResponses.map((item)=><article key={item.id} className="mt-3 border-t pt-3"><h3 className="font-semibold">{item.request_title}</h3><p className="text-sm text-slate-600">{item.delivery_location} · Your response: {item.message}</p><ConversationThread requestId={item.request_id} supplierId={account.id}/></article>)}</section>}

      {account.role==="candidate"&&<section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">My applications</h2><Link href="/grow" className="text-sm font-semibold text-emerald-700 underline">Find opportunities</Link></div>{applications.length===0?<p className="mt-4 text-sm text-slate-600">You haven’t applied for an opportunity yet.</p>:<div className="mt-4 divide-y">{applications.map((item)=><article className="flex flex-wrap items-center justify-between gap-3 py-4" key={item.id}><div><h3 className="font-semibold">{item.title}</h3><p className="text-sm text-slate-600">{item.organization} · {item.location}</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">{item.status}</span></article>)}</div>}</section>}

      {(account.role==="employer"||account.role==="talent_admin"||account.role==="super_admin")&&<section className="mt-8 grid gap-6 lg:grid-cols-2"><form onSubmit={submitOpportunity} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Post an opportunity</h2><div className="mt-4 grid gap-3"><label className="text-sm font-semibold">Job title<input required name="title" minLength={4} maxLength={180} className={field}/></label><label className="text-sm font-semibold">Organization<input required name="organization" minLength={2} maxLength={180} className={field}/></label><label className="text-sm font-semibold">Type<select name="type" className={field}><option value="job">Job</option><option value="internship">Internship</option><option value="attachment">Attachment</option></select></label><label className="text-sm font-semibold">Location<input required name="location" className={field}/></label><label className="text-sm font-semibold">Duration<input required name="duration" className={field} placeholder="Full time / 3 months"/></label><label className="text-sm font-semibold">Application deadline<input type="date" name="applicationDeadline" className={field}/></label><label className="text-sm font-semibold">Description<textarea required name="description" minLength={30} maxLength={8000} rows={4} className={field}/></label><button disabled={busy} className="rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy?"Publishing…":"Publish opportunity"}</button></div></form><div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Managed listings</h2>{opportunities.length===0?<p className="mt-4 text-sm text-slate-600">No opportunities have been posted yet.</p>:<div className="mt-3 divide-y">{opportunities.map((item)=><article className="py-4" key={item.id}><h3 className="font-semibold">{item.title}</h3><p className="text-sm text-slate-600">{item.organization} · {item.location} · <span className="capitalize">{item.status}</span></p></article>)}</div>}<h2 className="mt-8 text-xl font-bold">Applications received</h2>{applications.length===0?<p className="mt-3 text-sm text-slate-600">New candidate applications will show here.</p>:applications.map((item)=><article className="mt-3 border-t pt-3" key={item.id}><b>{item.candidate_name}</b><p className="text-sm">{item.opportunity_title} · {item.candidate_email}</p><p className="mt-2 text-sm text-slate-600">{item.cover_note}</p><div className="mt-2 flex flex-wrap gap-2">{(["reviewing","shortlisted","declined"] as const).map((status)=><button key={status} onClick={()=>void changeApplicationStatus(item.id,status)} className="rounded border px-2 py-1 text-xs capitalize">{status}</button>)}</div></article>)}</div></section>}

      {account.role==="supplier"||account.role==="skilled_provider"?<section className="mt-8 grid gap-6 lg:grid-cols-2"><form key={`${supplierProfile?.business_name??"new"}-${supplierProfile?.category??""}`} onSubmit={saveSupplierProfile} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Supplier profile</h2><p className="mt-1 text-sm text-slate-600">Profiles are checked by Bigthink before they appear in the public directory. Current status: <b className="capitalize">{supplierProfile?.verification_status??"not submitted"}</b></p><div className="mt-4 grid gap-3"><label className="text-sm font-semibold">Business name<input required name="businessName" defaultValue={supplierProfile?.business_name??""} className={field}/></label><label className="text-sm font-semibold">Category<input required name="category" defaultValue={supplierProfile?.category??""} placeholder="Construction, ICT, logistics…" className={field}/></label><label className="text-sm font-semibold">Location<input required name="location" defaultValue={supplierProfile?.location??""} className={field}/></label><label className="text-sm font-semibold">Website<input name="website" type="url" defaultValue={supplierProfile?.website??""} className={field}/></label><label className="text-sm font-semibold">Business description<textarea required name="description" minLength={30} defaultValue={supplierProfile?.description??""} rows={4} className={field}/></label><button disabled={busy} className="rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy?"Saving…":"Save profile for verification"}</button></div></form><div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Open buyer requests</h2><p className="mt-1 text-sm text-slate-600">Only verified suppliers can send a response.</p>{supplierRequests.length===0?<p className="mt-4 text-sm text-slate-600">No open buyer requests are available.</p>:supplierRequests.map((item)=><article key={item.id} className="mt-4 border-t pt-4"><p className="text-xs font-bold uppercase text-emerald-700">{item.category} · {item.quantity}</p><h3 className="mt-1 font-semibold">{item.title}</h3><p className="mt-1 text-sm text-slate-600">{item.delivery_location}</p><p className="mt-2 text-sm">{item.description}</p><form onSubmit={(event)=>void respondToBuyerRequest(event,item.id)} className="mt-3 grid gap-2"><label className="text-xs font-semibold">Your offer<textarea required name="message" minLength={20} maxLength={4000} rows={3} className={field}/></label><button disabled={busy} className="justify-self-start rounded-md border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-700">Send response</button></form></article>)}</div></section>:null}

      {account.role==="buyer"&&<section className="mt-8 grid gap-6 lg:grid-cols-2"><form onSubmit={submitBuyerRequest} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Create a procurement request</h2><div className="mt-4 grid gap-3"><label className="text-sm font-semibold">What do you need?<input required name="title" minLength={4} className={field}/></label><label className="text-sm font-semibold">Category<input required name="category" placeholder="Products, services, logistics…" className={field}/></label><label className="text-sm font-semibold">Quantity or scope<input required name="quantity" className={field}/></label><label className="text-sm font-semibold">Delivery location<input required name="deliveryLocation" className={field}/></label><label className="text-sm font-semibold">Needed by<input name="dueDate" type="date" className={field}/></label><label className="text-sm font-semibold">Specifications<textarea required name="description" minLength={30} rows={4} className={field}/></label><button disabled={busy} className="rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy?"Sending…":"Publish request"}</button></div></form><div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Your procurement requests</h2>{buyerRequests.length===0?<p className="mt-4 text-sm text-slate-600">You haven’t submitted a request yet.</p>:buyerRequests.map((item)=><article key={item.id} className="mt-4 border-t pt-4"><div className="flex justify-between gap-2"><h3 className="font-semibold">{item.title}</h3><span className="text-xs capitalize text-slate-500">{item.status}</span></div><p className="mt-1 text-sm text-slate-600">{item.category} · {item.quantity} · {item.delivery_location}</p><button onClick={()=>void showBuyerResponses(item.id)} className="mt-2 text-sm font-semibold text-emerald-700 underline">{item.response_count} supplier responses · {expandedRequest===item.id?"Hide":"View"}</button>{expandedRequest===item.id&&<div className="mt-2 space-y-3">{(replies[item.id]??[]).length===0?<p className="text-sm text-slate-500">No supplier responses yet.</p>:(replies[item.id]??[]).map((reply)=><div key={reply.id} className="rounded bg-slate-50 p-3"><b className="text-sm">{reply.business_name} · {reply.category}</b><p className="mt-1 text-sm text-slate-600">{reply.message}</p></div>)}</div>}</article>)}</div></section>}

      {(account.role==="events_admin"||account.role==="super_admin")&&<section className="mt-8 max-w-2xl"><form onSubmit={submitEvent} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Publish an event</h2><div className="mt-4 grid gap-3"><label className="text-sm font-semibold">Event title<input required name="title" minLength={4} className={field}/></label><label className="text-sm font-semibold">Category<input required name="category" placeholder="Careers, research, networking…" className={field}/></label><label className="text-sm font-semibold">Venue<input required name="venue" className={field}/></label><label className="text-sm font-semibold">Date and time<input required name="startsAt" type="datetime-local" className={field}/></label><label className="text-sm font-semibold">Capacity (optional)<input name="capacity" type="number" min="1" className={field}/></label><label className="text-sm font-semibold">Details<textarea required name="description" minLength={20} rows={4} className={field}/></label><button disabled={busy} className="rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy?"Publishing…":"Publish event"}</button></div></form></section>}

      {(account.role==="events_admin"||account.role==="super_admin")&&<section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Managed events & registrations</h2>{managedEvents.length===0?<p className="mt-4 text-sm text-slate-600">No events have been created yet.</p>:managedEvents.map((event)=> <article key={event.id} className="border-t py-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">{event.title}</h3><p className="text-sm text-slate-600">{event.category} · {event.venue} · {new Date(event.starts_at).toLocaleString()} · <span className="capitalize">{event.status}</span></p></div><button onClick={()=>void viewEventRoster(event.id)} className="rounded border px-3 py-2 text-sm font-semibold">View {event.registered_count} registrations</button></div>{eventRosters[event.id]&&<div className="mt-3 divide-y rounded bg-slate-50 px-3">{eventRosters[event.id].length===0?<p className="py-3 text-sm text-slate-600">No active registrations.</p>:eventRosters[event.id].map((person)=><p className="py-2 text-sm" key={person.id}>{person.full_name} · {person.email} · <span className="capitalize">{person.role.replaceAll("_"," ")}</span></p>)}</div>}</article>)}</section>}

      {(account.role==="verification_officer"||account.role==="super_admin")&&<section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Supplier verification queue</h2>{pendingSuppliers.length===0?<p className="mt-4 text-sm text-slate-600">There are no supplier profiles waiting for review.</p>:<div className="mt-4 divide-y">{pendingSuppliers.map((supplier)=><article className="py-4" key={supplier.id}><p className="text-sm font-semibold">{supplier.business_name} · {supplier.category}</p><p className="mt-1 text-xs text-slate-500">{supplier.full_name} · {supplier.email} · {supplier.location}</p><p className="mt-2 text-sm text-slate-600">{supplier.description}</p><div className="mt-3 flex gap-2"><button onClick={()=>void reviewSupplier(supplier.id,"verified")} className="rounded bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Verify</button><button onClick={()=>void reviewSupplier(supplier.id,"rejected")} className="rounded border border-red-300 px-3 py-2 text-sm font-semibold text-red-700">Reject</button></div></article>)}</div>}</section>}

      {(account.role==="content_editor"||account.role==="super_admin")&&<section className="mt-8 grid gap-6 lg:grid-cols-2"><form onSubmit={submitArticle} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Publish an insight</h2><div className="mt-4 grid gap-3"><label className="text-sm font-semibold">Title<input required name="title" minLength={8} maxLength={220} className={field}/></label><label className="text-sm font-semibold">Category<input required name="category" className={field} placeholder="Research, Careers, Procurement…"/></label><label className="text-sm font-semibold">Summary<input required name="summary" minLength={30} maxLength={500} className={field}/></label><label className="text-sm font-semibold">Cover image URL (optional)<input name="coverImage" type="url" className={field}/></label><label className="text-sm font-semibold">Article text<textarea required name="content" minLength={100} maxLength={50000} rows={10} className={field} placeholder="Separate paragraphs with a blank line"/></label><button disabled={busy} className="rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy?"Publishing…":"Publish insight"}</button></div></form><div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Your articles</h2>{draftArticles.length===0?<p className="mt-4 text-sm text-slate-600">You haven’t published an insight yet.</p>:draftArticles.map((article)=><article key={article.id} className="border-t py-4"><h3 className="font-semibold">{article.title}</h3><p className="text-sm text-slate-600">{article.category} · <span className="capitalize">{article.status}</span></p></article>)}</div></section>}

      {(account.role==="event_member"||account.role==="candidate"||account.role==="employer"||account.role==="supplier"||account.role==="buyer"||account.role==="skilled_provider")&&<section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">My event registrations</h2><Link href="/connect" className="text-sm font-semibold text-emerald-700 underline">Browse events</Link></div>{registrations.length===0?<p className="mt-4 text-sm text-slate-600">You haven’t registered for any events.</p>:registrations.map((item)=><article className="flex flex-wrap items-center justify-between gap-3 border-t py-4" key={item.id}><div><h3 className="font-semibold">{item.title}</h3><p className="text-sm text-slate-600">{item.venue} · {new Date(item.starts_at).toLocaleString()}</p></div><button onClick={()=>void cancelRegistration(item.event_id)} className="text-sm font-semibold text-red-700 underline">Cancel registration</button></article>)}</section>}

      <button onClick={logout} className="mt-8 text-sm font-semibold text-slate-600 underline">Sign out</button>
    </>}
  </main><SiteFooter/></>;
}
