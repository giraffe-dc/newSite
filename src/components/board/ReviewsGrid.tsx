import type { SectionData } from "@/lib/siteContent";
import { REVIEWS } from "./content";
import ReviewCard from "./ReviewCard";

export default function ReviewsGrid({
  reviews = REVIEWS,
}: {
  reviews?: SectionData<"reviews">["reviews"];
}) {
  return (
    <div className="m2-reviews">
      {reviews.map((review) => (
        <ReviewCard review={review} key={review.name} />
      ))}
    </div>
  );
}
