import type { Metadata } from "next";
import Link from "next/link";
import ReviewForm from "@/components/board/ReviewForm";
import ReviewsGrid from "@/components/board/ReviewsGrid";
import { getPublishedReviews } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Відгуки — Жирафик, виїзні свята",
  description:
    "Відгуки про виїзні свята: день народження вдома, випускний у дитсадку, привітання в офісі. Кожне свято — реальна локація.",
};

export const revalidate = 3600;

export default async function ReviewsPage() {
  const reviews = await getPublishedReviews();
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

        <ReviewsGrid reviews={reviews} />

        <section
          className="m2-notecard"
          style={{ marginTop: 36 }}
          aria-labelledby="review-form-title"
        >
          <h2 id="review-form-title" style={{ marginBottom: 10 }}>
            Залишити відгук
          </h2>
          <p style={{ marginBottom: 16 }}>
            Розкажіть, як пройшло свято. Кожен відгук ми перевіряємо перед
            публікацією — тому на сторінці лише справжні історії.
          </p>
          <ReviewForm />
        </section>

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
