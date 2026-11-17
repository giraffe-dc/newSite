import type { Metadata } from "next";
import Link from "next/link";
import { publishedOnly } from "@/components/board/content";
import ServiceAssistant from "@/components/board/ServiceAssistant";
import { getSection } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Підбір програми за віком і тривалістю — Жирафик",
  description:
    "Помічник підбору: вік дітей, кількість гостей і тривалість свята — покажемо послуги, що вміщуються у ваш час, з чесними цінами.",
  alternates: { canonical: "https://giraffe-teplyk.vercel.app/assistant" },
};

export const revalidate = 3600;

export default async function AssistantPage() {
  const [services, contactsSection, assistant, packages] = await Promise.all([
    getSection("services"),
    getSection("contacts"),
    getSection("assistant"),
    getSection("packages"),
  ]);

  return (
    <div className="m2-inner">
      <div className="m2-wrap">
        <div className="m2-inner__head">
          <h1 className="m2-inner__title">Підбір програми за 30 секунд</h1>
          <p className="m2-inner__lede">
            Вкажіть вік дітей, кількість гостей і тривалість — покажемо лише ті
            послуги, що реально вміщуються у ваш час, з цінами й умовами без
            прихованих «дрібних літер».
          </p>
        </div>

        <ServiceAssistant
          services={publishedOnly(services.services)}
          contacts={contactsSection.contacts}
          packages={publishedOnly(packages.packages)}
          settings={assistant}
        />

        <div className="m2-inline" style={{ marginTop: 36 }}>
          <Link className="m2-btn m2-btn--ghost" href="/services">
            Увесь каталог
          </Link>
          <Link className="m2-btn m2-btn--ghost" href="/packages">
            Готові пакети
          </Link>
          <Link className="m2-back" href="/calculator">
            Порахувати вартість
          </Link>
        </div>
      </div>
    </div>
  );
}
