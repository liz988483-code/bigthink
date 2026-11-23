"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Boxes, BriefcaseBusiness, Search, Truck, Wrench } from "lucide-react";

const categories = [
  { title: "Construction & Building", kind: "Products", description: "Materials, tools, fittings and specialist trade services.", icon: Boxes },
  { title: "Agriculture & Food", kind: "Products", description: "Farm inputs, fresh produce, food processing and distribution.", icon: Boxes },
  { title: "ICT & Office", kind: "Products", description: "Technology equipment, office supplies and support services.", icon: BriefcaseBusiness },
  { title: "Professional Services", kind: "Services", description: "Business, creative, technical and professional expertise.", icon: Wrench },
  { title: "Transport & Logistics", kind: "Logistics", description: "Delivery, freight, storage and transport capabilities.", icon: Truck },
  { title: "Events & Hospitality", kind: "Services", description: "Venues, catering, event production and related services.", icon: BriefcaseBusiness },
];
const kinds = ["All", "Products", "Services", "Logistics"];

export function BuildCategories() {
  const [kind, setKind] = useState("All");
  const [query, setQuery] = useState("");
  const results = useMemo(() => categories.filter((category) => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const text = `${category.title} ${category.kind} ${category.description}`.toLowerCase();
    return (kind === "All" || category.kind === kind) && words.every((word) => text.includes(word));
  }), [kind, query]);

  return <>
    <label className="grow-search build-search"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, services or logistics" aria-label="Search supplier categories"/></label>
    <div className="grow-filters" aria-label="Filter supplier categories">{kinds.map((item) => <button key={item} type="button" aria-pressed={kind === item} className={kind === item ? "selected" : ""} onClick={() => setKind(item)}>{item}</button>)}</div>
    <p className="grow-count" aria-live="polite">{results.length} {results.length === 1 ? "category" : "categories"}</p>
    {results.length ? <div className="build-categories">{results.map(({title,kind,description,icon:Icon})=><article className="build-category" key={title}><span className="build-category-icon"><Icon size={21}/></span><span className="build-category-kind">{kind}</span><h3>{title}</h3><p>{description}</p><a href="/contact">Enquire about this category <ArrowRight size={14}/></a></article>)}</div> : <div className="no-results"><h3>No categories match that search</h3><p>Try another term or choose a different category filter.</p></div>}
  </>;
}
