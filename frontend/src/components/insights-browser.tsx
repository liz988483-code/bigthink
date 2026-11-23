"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, Search } from "lucide-react";
import { insightArticles } from "@/lib/insights";

const apiUrl=process.env.NEXT_PUBLIC_API_URL??"http://localhost:4000";

export function InsightsBrowser() {
  const [articles,setArticles]=useState(insightArticles);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  useEffect(()=>{fetch(`${apiUrl}/api/insights`).then(async(response)=>{if(!response.ok)return;const result=await response.json() as {articles:Array<{slug:string;title:string;category:string;summary:string;cover_image:string|null}>};if(result.articles.length)setArticles(result.articles.map((item)=>({slug:item.slug,title:item.title,category:item.category,excerpt:item.summary,readTime:"Article",image:item.cover_image??"photo-1455390582262-044cdead277a",body:[]})));}).catch(()=>undefined);},[]);
  const activeCategories=["All",...new Set(articles.map((article)=>article.category))];
  const results = useMemo(() => articles.filter((article) => {
    const text = `${article.title} ${article.category} ${article.excerpt}`.toLowerCase();
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return (category === "All" || article.category === category) && words.every((word) => text.includes(word));
  }), [articles, category, query]);

  function imageUrl(image:string){return image.startsWith("http")?image:`https://images.unsplash.com/${image}?auto=format&fit=crop&w=700&q=80`;}

  return <>
    <label className="grow-search insights-search"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search articles and topics" aria-label="Search insights"/></label>
    <div className="grow-filters insights-filters" aria-label="Filter insights by category">{activeCategories.map((item) => <button type="button" key={item} aria-pressed={category === item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <p className="grow-count" aria-live="polite">{results.length} {results.length === 1 ? "article" : "articles"}</p>
    {results.length ? <div className="insights-browser-grid">{results.map((article) => <a className="insight-card" href={`/insights/${article.slug}`} key={article.slug}><div className="insight-image" style={{backgroundImage:`url(${imageUrl(article.image)})`}}/><span className="category">{article.category.toUpperCase()}</span><div className="insight-text"><b>{article.title}</b><p>{article.excerpt}</p><span>{article.readTime}<Clock3 size={13}/><ArrowRight size={15}/></span></div></a>)}</div> : <div className="no-results"><h3>No articles match those filters</h3><p>Try another topic or select a different category.</p></div>}
  </>;
}
