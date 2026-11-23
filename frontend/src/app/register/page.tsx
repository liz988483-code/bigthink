import { AccountForm } from "@/components/account-form";
import { SiteFooter, SiteHeader } from "@/components/site";

export const metadata = { title: "Create an Account | Bigthink" };

export default function RegisterPage() {
  return <><SiteHeader active=""/><AccountForm mode="register"/><SiteFooter/></>;
}
