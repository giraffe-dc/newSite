import type { Metadata } from "next";
import Link from "next/link";
import FaqList from "@/components/board/FaqList";

export const metadata: Metadata = {
  title: "FAQ — Жирафик, виїзні свята",
  description:
    "Відповіді на найпоширеніші питання про бронювання, оплату, зону діяльності та формати свят.",
};

export default function FAQPage() {
  return (
    <div className="m2-inner">
      <div className="m2-wrap">
        <div className="m2-inner__head">
          <h1 className="m2-inner__title">Питаєте — відповідаємо</h1>
          <p className="m2-inner__lede">
            Найпопулярніші запити про бронювання, ціни та організацію свята.
            Якщо чогось немає — пишіть у чат на сайті.
          </p>
        </div>

        <FaqList />

        <div className="m2-inline" style={{ marginTop: 40 }}>
          <Link className="m2-btn" href="/book">
            Забронювати дату
          </Link>
          <Link className="m2-btn m2-btn--ghost" href="/services">
            Пообірати послуги
          </Link>
        </div>
      </div>
    </div>
  );
}
