import type { Metadata } from "next";
import Link from "next/link";
import Calculator from "@/components/board/Calculator";
import { getSection } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Порахувати вартість — Жирафик, виїзні свята",
  description:
    "Орієнтовний кошторис із базових цін послуг: аніматори, ростові ляльки, VR-клас і PlayStation 4.",
};

export const revalidate = 3600;

export default async function CalculatorPage() {
  const [calculator, services] = await Promise.all([
    getSection("calculator"),
    getSection("services"),
  ]);
  return (
    <div className="m2-inner">
      <div className="m2-wrap">
        <div className="m2-inner__head">
          <h1 className="m2-inner__title">Кошторис свята</h1>
          <p className="m2-inner__lede">
            Позначте послуги й отримайте орієнтовну суму. Точну ціну, дату й
            адресу узгодить команда після заявки.
          </p>
        </div>

        <Calculator
          services={services.services}
          calcNote={calculator.calcNote}
        />

        <div className="m2-inline" style={{ marginTop: 36 }}>
          <Link className="m2-btn m2-btn--ghost" href="/packages">
            Готові пакети
          </Link>
          <Link className="m2-back" href="/#book">
            Забронювати дату
          </Link>
        </div>
      </div>
    </div>
  );
}
