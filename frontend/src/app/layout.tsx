import type { Metadata } from "next";
import "./globals.css";
import "./interactions.css";
import "./build.css";
import "./connect.css";
import "./insights.css";
import "./think.css";
import "./about.css";

export const metadata: Metadata = {
  title: "Bigthink — Knowledge. People. Business.",
  description: "Connecting knowledge, people, opportunities and businesses to create real growth and lasting impact.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
