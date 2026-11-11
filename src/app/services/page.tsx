import type { Metadata } from "next";
import Link from "next/link";
import FaqList from "@/components/board/FaqList";
import ServicesGrid from "@/components/board/ServicesGrid";
import { getSection } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Що ми привозимо — Жирафик, виїзні свята",
  description:
    "Аніматори, ростові ляльки, VR-клас і PlayStation 4 з виїздом додому, до школи чи на майданчик. Ціни й готові пакети.",
};

export const revalidate = 3600;

export default async function ServicesPage() {
  const [services, faq] = await Promise.all([
    getSection("services"),
    getSection("faq"),
  ]);
  return (
    <div className="m2-inner">
      <div className="m2-wrap">
        <div className="m2-inner__head">
          <h1 className="m2-inner__title">Що ми привозимо з собою</h1>
          <p className="m2-inner__lede">
            Оберіть формат — ми зберемо програму під вік дітей і ваше
            приміщення. Усе обладнання, реквізит і костюми приїжджають разом із
            командою.
          </p>
        </div>

        <ServicesGrid services={services.services} />

        <div className="m2-inline" style={{ marginTop: 32 }}>
          <Link className="m2-btn" href="/#book">
            Забронювати дату
          </Link>
          <Link className="m2-btn m2-btn--ghost" href="/calculator">
            Порахувати вартість
          </Link>
          <Link className="m2-back" href="/packages">
            Готові пакети
          </Link>
        </div>

        <h2
          style={{
            marginTop: 56,
            marginBottom: 24,
            color: "var(--green-deep)",
          }}
        >
          Питаєте — відповідаємо
        </h2>
        <FaqList faq={faq.faq} />
      </div>
    </div>
  );
}
