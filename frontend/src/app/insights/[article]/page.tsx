import { notFound } from "next/navigation";
import { SiteHeader, SiteFooter } from "@/components/site";
import { insightArticles } from "@/lib/insights";
import { ArrowLeft, Clock3 } from "lucide-react";

export function generateStaticParams(){return insightArticles.map(({slug})=>({article:slug}));}
export const dynamicParams = true;

export default async function InsightArticlePage({params}:{params:Promise<{article:string}>}) {
  const {article:slug}=await params;
  let article=insightArticles.find((item)=>item.slug===slug);
  if(!article){
    try{
      const apiUrl=process.env.NEXT_PUBLIC_API_URL??"http://localhost:4000";
      const response=await fetch(`${apiUrl}/api/insights/${encodeURIComponent(slug)}`,{cache:"no-store"});
      if(response.ok){
        const result=await response.json() as {article:{slug:string;title:string;category:string;summary:string;content:string;cover_image:string|null}};
        const item=result.article;
        article={slug:item.slug,title:item.title,category:item.category,excerpt:item.summary,readTime:`${Math.max(1,Math.ceil(item.content.trim().split(/\s+/).length/200))} min read`,image:item.cover_image??"photo-1455390582262-044cdead277a",body:item.content.split(/\r?\n\s*\r?\n/).filter(Boolean)};
      }
    }catch{}
  }
  if(!article)notFound();
  const cover=article.image.startsWith("http")?article.image:`https://images.unsplash.com/${article.image}?auto=format&fit=crop&w=1800&q=85`;
  return <><SiteHeader active="Insights"/><main>
    <section className="article-hero"><div className="article-hero-image" style={{backgroundImage:`url(${cover})`}}/><div className="article-hero-shade"/><div className="wrap article-hero-content"><a href="/insights" className="article-back"><ArrowLeft size={14}/> All insights</a><span className="article-category">{article.category}</span><h1>{article.title}</h1><p>{article.excerpt}</p><span className="article-read"><Clock3 size={14}/>{article.readTime}</span></div></section>
    <article className="wrap article-body">{article.body.map((paragraph,index)=><p key={index}>{paragraph}</p>)}<div className="article-end"><h2>Continue exploring Bigthink</h2><p>Find more practical ideas and opportunities across our community.</p><a className="button primary" href="/insights">More insights <ArrowLeft size={14}/></a></div></article>
  </main><SiteFooter/></>;
}
