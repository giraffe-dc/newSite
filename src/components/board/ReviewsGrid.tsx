import { REVIEWS, type ReviewItem } from "./content";
import ReviewCard from "./ReviewCard";

export default function ReviewsGrid({
  reviews = REVIEWS,
}: {
  reviews?: ReviewItem[];
}) {
  return (
    <div className="m2-reviews">
      {reviews.map((review) => (
        <ReviewCard review={review} key={review.id} />
      ))}
    </div>
  );
}
