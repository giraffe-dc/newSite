import { getSection } from "@/lib/siteContent";
import NewsContacts from "./NewsContacts";

/** Новини й контакти: контакти — server → client пропсом (site_content),
 *  новини клієнт тягне сам із /api/data/news. */
export const revalidate = 3600;

export default async function NewsContactsPage() {
  const { contacts } = await getSection("contacts");
  return <NewsContacts fallback={contacts} />;
}
