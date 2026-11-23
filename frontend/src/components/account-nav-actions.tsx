"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const apiUrl=process.env.NEXT_PUBLIC_API_URL??"http://localhost:4000";

export function AccountNavActions(){
  const [signedIn,setSignedIn]=useState(false);
  useEffect(()=>{fetch(`${apiUrl}/api/auth/me`,{credentials:"include"}).then((response)=>setSignedIn(response.ok)).catch(()=>setSignedIn(false));},[]);
  return <div className="nav-actions"><Link className="button outline" href={signedIn?"/account":"/login"}>{signedIn?"My Account":"Login"}</Link><Link className="button primary" href={signedIn?"/account":"/register"}>{signedIn?"Dashboard":"Get Started"}</Link></div>;
}
