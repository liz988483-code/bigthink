import { AccountForm } from "@/components/account-form";
import { SiteFooter, SiteHeader } from "@/components/site";

export const metadata = { title: "Login | Bigthink" };

export default function LoginPage() {
  return <><SiteHeader active=""/><AccountForm mode="login"/><SiteFooter/></>;
}
