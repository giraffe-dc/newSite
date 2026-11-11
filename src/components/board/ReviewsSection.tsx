import Link from "next/link";
import { HOME_REVIEW_INDEXES, REVIEWS } from "./content";
import ReviewCard from "./ReviewCard";

/** Два відгуки на головній + посилання на всі відгуки. */
export default function ReviewsSection() {
  const shown = HOME_REVIEW_INDEXES.map((index) => REVIEWS[index]);

  return (
    <section
      className="m2-sec m2-sec--tint"
      id="reviews"
      aria-labelledby="reviews-title"
    >
      <div className="m2-wrap">
        <div className="m2-sec__top">
          <div className="m2-sec__head">
            <h2 id="reviews-title">Листівки від наших замовників</h2>
            <p>
              Кожне свято — реальна локація: квартира, школа, дитсадок чи
              майданчик.
            </p>
          </div>
          <Link className="m2-btn m2-btn--ghost m2-btn--sm" href="/reviews">
            Усі відгуки →
          </Link>
        </div>
        <div className="m2-reviews">
          {shown.map((review) => (
            <ReviewCard review={review} key={review.name} />
          ))}
        </div>
      </div>
    </section>
  );
}
