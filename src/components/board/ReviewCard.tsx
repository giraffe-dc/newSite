import type { SectionData } from "@/lib/siteContent";

/** Редагований тип відгуку (з БД приходять звичайні string, не літерали). */
type Review = SectionData<"reviews">["reviews"][number];

/** Одна листівка-відгук — спільна для сітки відгуків і секції на головній. */
export default function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="m2-review">
      <div className="m2-review__stars" role="img" aria-label="Оцінка: 5 зірок">
        {review.stars}
      </div>
      <blockquote>{review.quote}</blockquote>
      <div className="m2-review__who">
        <div className={`m2-review__ava ${review.avatar}`} aria-hidden="true">
          {review.initial}
        </div>
        <div>
          <b>{review.name}</b>
          <span>{review.context}</span>
        </div>
      </div>
    </article>
  );
}
