import type { Metadata } from "next";
import { getSection } from "@/lib/siteContent";
import NewsContacts from "./NewsContacts";

export const metadata: Metadata = {
  title: "Новини та контакти — Жирафик, виїзні свята",
  description:
    "Новини про виїзди й зміни програм, а також контакти команди «Жирафик»: телефон, пошта, години роботи.",
  alternates: { canonical: "https://giraffe-teplyk.vercel.app/news-contacts" },
};

/** Новини й контакти: контакти — server → client пропсом (site_content),
 *  новини клієнт тягне сам із /api/data/news. */
export const revalidate = 3600;

export default async function NewsContactsPage() {
  const { contacts } = await getSection("contacts");
  return <NewsContacts fallback={contacts} />;
}
