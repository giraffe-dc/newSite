import type { Metadata } from "next";
import Link from "next/link";
import Calculator from "@/components/board/Calculator";

export const metadata: Metadata = {
  title: "Порахувати вартість — Жирафик, виїзні свята",
  description:
    "Орієнтовний кошторис із базових цін послуг: аніматори, ростові ляльки, VR-клас і PlayStation 4.",
};

export default function CalculatorPage() {
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

        <Calculator />

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
