import { SiteHeader, SiteFooter } from "@/components/site";
import { BuildCategories } from "@/components/build-categories";
import { SupplierDirectory } from "@/components/supplier-directory";
import { ArrowRight, BadgeCheck, ClipboardList, MessageSquareText, PackageSearch } from "lucide-react";

const steps = [
  { icon: PackageSearch, title: "Share what you need", text: "Buyers describe products, services, quantities and delivery requirements." },
  { icon: BadgeCheck, title: "Review supplier details", text: "Bigthink can review submitted business information before directory publication." },
  { icon: MessageSquareText, title: "Make a connection", text: "Interested buyers and suppliers can make an inquiry through Bigthink." },
  { icon: ClipboardList, title: "Agree the next steps", text: "The parties discuss specifications, quotations, delivery and commercial terms." },
];

export default function BuildPage() {
  return <><SiteHeader active="Build"/><main>
    <section className="subhero build"><div className="subhero-img" style={{backgroundImage:"url(https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1800&q=85)"}}/><div className="subhero-overlay"/><div className="wrap subhero-content"><p className="eyebrow light">BUILD · PROCUREMENT & SUPPLY</p><h1>Grow Your Business</h1><p>Connect with suppliers, buyers and logistics providers across a growing business network.</p><a href="#categories" className="button primary">Explore Categories <ArrowRight size={15}/></a></div></section>
    <section className="wrap build-intro"><div><p className="eyebrow">A NETWORK FOR BUSINESS</p><h2>Find the capabilities your work needs.</h2></div><p>Bigthink Build brings businesses together to discover suppliers, share requirements and explore practical procurement connections. Listings and introductions should be reviewed before the network is opened to transactions.</p></section>
    <section className="wrap build-directory" id="categories"><div className="grow-section-heading"><div><p className="eyebrow">DISCOVER THE NETWORK</p><h2>Explore supplier categories</h2><p>Search by the products, services or logistics capabilities you need.</p></div></div><BuildCategories/></section>
    <SupplierDirectory/>
    <section className="build-audience"><div className="wrap build-audience-grid"><article><span className="audience-label">FOR SUPPLIERS</span><h2>Show buyers what you can do.</h2><p>Share your business profile, products, services and operating areas so potential partners can understand your capabilities.</p><a className="button primary" href="/contact">Register your interest <ArrowRight size={14}/></a></article><article><span className="audience-label">FOR BUYERS</span><h2>Describe what your business needs.</h2><p>Tell Bigthink about your specifications, quantities, delivery location and timeline so we can help route your inquiry.</p><a className="button outline" href="/contact">Submit a buyer inquiry <ArrowRight size={14}/></a></article></div></section>
    <section className="grow-how build-how"><div className="wrap"><p className="eyebrow">FROM NEED TO CONNECTION</p><h2>How the network works</h2><div className="grow-steps">{steps.map(({icon:Icon,title,text},index)=><article className="grow-step" key={title}><span className="grow-step-number">{index+1}</span><span className="grow-step-icon"><Icon size={20}/></span><h3>{title}</h3><p>{text}</p></article>)}</div><p className="build-note">Bigthink facilitates introductions; businesses should complete their own checks and agree terms directly before any transaction.</p></div></section>
  </main><SiteFooter/></>;
}
