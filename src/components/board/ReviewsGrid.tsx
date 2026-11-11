import { REVIEWS } from "./content";
import ReviewCard from "./ReviewCard";

export default function ReviewsGrid() {
  return (
    <div className="m2-reviews">
      {REVIEWS.map((review) => (
        <ReviewCard review={review} key={review.name} />
      ))}
    </div>
  );
}
