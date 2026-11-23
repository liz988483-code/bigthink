"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";

type EventItem = { id:string; title:string; category:string; description:string; venue:string; starts_at:string; ends_at:string|null; capacity:number|null; registered_count:number };
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function UpcomingEvents({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registeredIds,setRegisteredIds]=useState<Set<string>>(()=>new Set());
  const [pendingEventId,setPendingEventId]=useState<string|null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${apiUrl}/api/events`),
      fetch(`${apiUrl}/api/events/mine/registrations`,{credentials:"include"}),
    ]).then(async ([eventsResponse,registrationsResponse])=>{
      if(!eventsResponse.ok)throw new Error("Could not load events");
      const eventsResult=await eventsResponse.json() as {events:EventItem[]};
      setEvents(eventsResult.events);
      if(registrationsResponse.ok){const registrations=await registrationsResponse.json() as {registrations:Array<{event_id:string}>};setRegisteredIds(new Set(registrations.registrations.map((item)=>item.event_id)));}
    }).catch(() => setMessage("Events will appear here when the Bigthink API is connected.")).finally(() => setLoading(false));
  }, []);

  async function register(eventId:string) {
    setMessage("");setPendingEventId(eventId);
    try {
      const response=await fetch(`${apiUrl}/api/events/${eventId}/registrations`,{method:"POST",credentials:"include"});
      const result=await response.json() as {error?:string;message?:string};
      if(response.status===401){router.push("/login");return;}
      if(!response.ok)throw new Error(result.error??"Registration failed.");
      setMessage(result.message??"You are registered.");
      setRegisteredIds((current)=>new Set(current).add(eventId));
      setEvents((current)=>current.map((event)=>event.id===eventId?{...event,registered_count:event.registered_count+1}:event));
    }catch(error){setMessage(error instanceof Error?error.message:"Registration failed.");}
    finally{setPendingEventId(null);}
  }

  if (compact) return <div aria-live="polite">
    {loading && <p className="py-3 text-sm text-slate-500">Loading upcoming events…</p>}
    {!loading && events.length===0 && <p className="py-3 text-sm text-slate-500">{message||"No upcoming events have been announced yet."}</p>}
    {events.slice(0,4).map((event)=><article className="event-row" key={event.id}><div className="date-box"><small>{new Date(event.starts_at).toLocaleDateString("en",{month:"short"}).toUpperCase()}</small><b>{new Date(event.starts_at).getDate()}</b></div><div className="event-info"><b>{event.title}</b><small><MapPin size={12}/>{event.venue}</small><small><CalendarDays size={12}/>{new Date(event.starts_at).toLocaleTimeString("en",{hour:"numeric",minute:"2-digit"})}</small></div><button className="register" disabled={pendingEventId===event.id||registeredIds.has(event.id)||(event.capacity!==null&&event.registered_count>=event.capacity)} onClick={()=>void register(event.id)}>{pendingEventId===event.id?"Registering…":registeredIds.has(event.id)?"Registered":event.capacity!==null&&event.registered_count>=event.capacity?"Full":"Register"}</button></article>)}
    {message&&!loading&&events.length>0&&<p className="mt-2 text-xs text-slate-600" role="status">{message}</p>}
  </div>;

  return <div className="grid gap-4 md:grid-cols-2" aria-live="polite">
    {loading&&<p className="text-sm text-slate-500">Loading upcoming events…</p>}
    {!loading&&events.length===0&&<p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">{message||"No upcoming events have been announced yet. Please check back soon."}</p>}
    {events.map((event)=><article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={event.id}>
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{event.category}</p><h3 className="mt-2 text-lg font-bold text-slate-900">{event.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{event.description}</p><p className="mt-3 flex items-center gap-2 text-sm text-slate-600"><MapPin size={15}/>{event.venue}</p>
      <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><CalendarDays size={15}/>{new Date(event.starts_at).toLocaleString("en",{dateStyle:"medium",timeStyle:"short"})}</p>
      <div className="mt-4 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">{event.capacity===null?`${event.registered_count} registered`: `${Math.max(event.capacity-event.registered_count,0)} places left`}</span><button disabled={pendingEventId===event.id||registeredIds.has(event.id)||(event.capacity!==null&&event.registered_count>=event.capacity)} onClick={()=>void register(event.id)} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">{pendingEventId===event.id?"Registering…":registeredIds.has(event.id)?"Registered":event.capacity!==null&&event.registered_count>=event.capacity?"Event full":"Register"}</button></div>
    </article>)}
    {message&&events.length>0&&<p className="text-sm text-slate-600" role="status">{message}</p>}
  </div>;
}
