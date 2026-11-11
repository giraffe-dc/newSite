import type { SectionData } from "@/lib/siteContent";
import { FAQ } from "./content";
import FaqList from "./FaqList";

export default function FaqSection({
  faq = FAQ,
}: {
  faq?: SectionData<"faq">["faq"];
}) {
  return (
    <section className="m2-sec" id="faq" aria-labelledby="faq-title">
      <div className="m2-wrap">
        <div className="m2-sec__head m2-sec__head--center">
          <h2 id="faq-title">Питаєте — відповідаємо</h2>
        </div>
        <FaqList faq={faq} />
      </div>
    </section>
  );
}
