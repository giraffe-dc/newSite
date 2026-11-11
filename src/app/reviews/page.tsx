import type { Metadata } from "next";
import Link from "next/link";
import ReviewsGrid from "@/components/board/ReviewsGrid";

export const metadata: Metadata = {
  title: "Відгуки — Жирафик, виїзні свята",
  description:
    "Відгуки про виїзні свята: день народження вдома, випускний у дитсадку, привітання в офісі. Кожне свято — реальна локація.",
};

export default function ReviewsPage() {
  return (
    <div className="m2-inner">
      <div className="m2-wrap">
        <div className="m2-inner__head">
          <h1 className="m2-inner__title">Листівки від наших замовників</h1>
          <p className="m2-inner__lede">
            Кожне свято — реальна локація: квартира, школа, дитсадок чи
            майданчик.
          </p>
        </div>

        <ReviewsGrid />

        <div className="m2-notecard" style={{ marginTop: 36 }}>
          <b>Про ці записи.</b> Тексти перенесено з демо-макета №2. Після
          підключення бази й адмінки тут будуть реальні відгуки з дозволених
          публікацій.
        </div>

        <div className="m2-inline" style={{ marginTop: 24 }}>
          <Link className="m2-btn" href="/#book">
            Забронювати дату
          </Link>
          <Link className="m2-btn m2-btn--ghost" href="/news-contacts">
            Новини й контакти
          </Link>
        </div>
      </div>
    </div>
  );
}
