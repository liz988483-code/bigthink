"use client";

import { useEffect, useState } from "react";
import { MapPin, PackageSearch } from "lucide-react";

type Supplier={id:string;business_name:string;category:string;description:string;location:string;website:string|null};
const apiUrl=process.env.NEXT_PUBLIC_API_URL??"http://localhost:4000";

export function SupplierDirectory(){
  const [suppliers,setSuppliers]=useState<Supplier[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{fetch(`${apiUrl}/api/marketplace/suppliers`).then(async response=>{if(!response.ok)throw new Error();const result=await response.json() as {suppliers:Supplier[]};setSuppliers(result.suppliers);}).catch(()=>undefined).finally(()=>setLoading(false));},[]);
  return <section className="wrap build-directory"><div className="grow-section-heading"><div><p className="eyebrow">VERIFIED BUSINESSES</p><h2>Supplier directory</h2><p>Business profiles appear here after Bigthink verifies their details.</p></div></div>
    {loading?<p className="text-sm text-slate-500">Loading verified suppliers…</p>:suppliers.length===0?<div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600"><PackageSearch className="mb-3 text-emerald-700"/><p>There are no verified supplier profiles yet. Suppliers can create an account and submit their details for review.</p></div>:<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{suppliers.map(supplier=><article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={supplier.id}><span className="text-xs font-bold uppercase tracking-wide text-emerald-700">{supplier.category}</span><h3 className="mt-2 text-lg font-bold">{supplier.business_name}</h3><p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13}/>{supplier.location}</p><p className="mt-3 text-sm leading-6 text-slate-600">{supplier.description}</p>{supplier.website&&<a className="mt-4 inline-block text-sm font-semibold text-emerald-700 underline" href={supplier.website} target="_blank" rel="noreferrer">Visit website</a>}</article>)}</div>}
  </section>;
}
