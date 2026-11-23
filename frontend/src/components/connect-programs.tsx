"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, BriefcaseBusiness, Building2, CalendarDays, Search, Users } from "lucide-react";

const programs = [
  { title: "Career Connect", category: "Careers", description: "Career fairs, employer conversations and practical sessions for job seekers.", icon: BriefcaseBusiness },
  { title: "Business Connect", category: "Business", description: "Meetups and forums for entrepreneurs, businesses and professional teams.", icon: Building2 },
  { title: "Supplier Connect", category: "Supplier network", description: "Build relationships with suppliers, buyers and procurement teams.", icon: Users },
  { title: "Research Forums", category: "Research", description: "Share ideas and learn with researchers, students and organizations.", icon: BookOpen },
  { title: "Workshops & Masterclasses", category: "Learning", description: "Build practical knowledge through guided learning sessions.", icon: CalendarDays },
  { title: "Professional Meetups", category: "Networking", description: "Connect with people in your field and grow your professional network.", icon: Users },
];
const categories = ["All", "Careers", "Business", "Supplier network", "Research", "Learning", "Networking"];

export function ConnectPrograms() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const results = useMemo(() => programs.filter((program) => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const content = `${program.title} ${program.category} ${program.description}`.toLowerCase();
    return (category === "All" || program.category === category) && words.every((word) => content.includes(word));
  }), [category, query]);

  return <>
    <label className="grow-search connect-search"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events and programmes" aria-label="Search events and programmes"/></label>
    <div className="grow-filters connect-filters" aria-label="Filter event programmes">{categories.map((item) => <button type="button" key={item} aria-pressed={category === item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <p className="grow-count" aria-live="polite">{results.length} {results.length === 1 ? "programme" : "programmes"}</p>
    {results.length ? <div className="connect-program-grid">{results.map(({title,category,description,icon:Icon})=><article className="connect-program" key={title}><span className="connect-program-icon"><Icon size={21}/></span><span className="connect-program-category">{category}</span><h3>{title}</h3><p>{description}</p><div className="connect-program-bottom"><span>Event details announced by Bigthink</span><a href="/contact">Register interest <ArrowRight size={14}/></a></div></article>)}</div> : <div className="no-results"><h3>No programmes match that search</h3><p>Try another term or select a different category.</p></div>}
  </>;
}
