import type { Metadata } from "next";
import Link from "next/link";
import BookingSection from "@/components/board/BookingSection";
import { getSection } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Забронювати свято — Жирафик",
  description:
    "Залиште дату, адресу й контакт. Відповідаємо протягом години щодня з 9:00 до 21:00.",
};

export const revalidate = 3600;

export default async function BookPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await (searchParams ?? {})) as Record<
    string,
    string | string[] | undefined
  >;

  const [book, contactsSection] = await Promise.all([
    getSection("book"),
    getSection("contacts"),
  ]);
  const contacts = contactsSection.contacts;

  let items;
  const rawItems = params.items;
  if (typeof rawItems === "string") {
    try {
      items = JSON.parse(rawItems);
    } catch {
      items = undefined;
    }
  }

  return (
    <div className="m2-inner">
      <div className="m2-wrap">
        <div className="m2-inner__head">
          <h1 className="m2-inner__title">Забронювати свято</h1>
          <p className="m2-inner__lede">
            Форма на сайті або дзвінок: {contacts.phone}. Відповідаємо протягом
            години {contacts.hours}.
          </p>
        </div>
      </div>

      <BookingSection
        book={book.book}
        contacts={contacts}
        service={
          typeof params.format === "string"
            ? params.format
            : typeof params.service === "string"
              ? params.service
              : undefined
        }
        serviceName={
          typeof params.service === "string" ? params.service : undefined
        }
        packageId={
          typeof params.package === "string" ? params.package : undefined
        }
        packageName={
          typeof params.packageName === "string" ? params.packageName : undefined
        }
        programId={
          typeof params.programId === "string" ? params.programId : undefined
        }
        items={items}
      />

      <div className="m2-wrap">
        <div className="m2-inline">
          <Link className="m2-btn m2-btn--ghost" href="/services">
            Що ми привозимо
          </Link>
          <Link className="m2-btn m2-btn--ghost" href="/packages">
            Готові пакети
          </Link>
        </div>
      </div>
    </div>
  );
}
