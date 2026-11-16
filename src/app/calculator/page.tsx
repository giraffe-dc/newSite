import type { Metadata } from "next";
import Link from "next/link";
import Calculator from "@/components/board/Calculator";
import { publishedOnly } from "@/components/board/content";
import { getSection } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Порахувати вартість — Жирафик, виїзні свята",
  description:
    "Орієнтовний кошторис із базових цін послуг: аніматори, ростові ляльки, VR-клас і PlayStation 4.",
  alternates: { canonical: "https://giraffe-teplyk.vercel.app/calculator" },
};

export const revalidate = 3600;

export default async function CalculatorPage() {
  const [calculator, services, packages] = await Promise.all([
    getSection("calculator"),
    getSection("services"),
    getSection("packages"),
  ]);
  const visibleServices = publishedOnly(services.services);
  const visiblePackages = publishedOnly(packages.packages);
  /* Транспортні поля можуть бути відсутні в старих документах БД —
     фолбек на погоджені дефолти (25 грн/км, без безкоштовної зони). */
  const roadTariff =
    typeof calculator.roadTariff === "number" ? calculator.roadTariff : 25;
  const roadFreeKm =
    typeof calculator.roadFreeKm === "number" ? calculator.roadFreeKm : 0;
  const roadNote =
    typeof calculator.roadNote === "string" && calculator.roadNote
      ? calculator.roadNote
      : "Транспорт: 25 грн за кілометр в один бік від Теплика. Відстань і вартість уточнюється за адресою — остаточно підтвердить менеджер.";
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
          services={visibleServices}
          packages={visiblePackages}
          calcNote={calculator.calcNote}
          roadTariff={roadTariff}
          roadFreeKm={roadFreeKm}
          roadNote={roadNote}
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
