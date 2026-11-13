import type { SectionData } from "@/lib/siteContent";
import { FAQ } from "./content";

export default function FaqList({
  faq = FAQ,
}: {
  faq?: SectionData<"faq">["faq"];
}) {
  if (!faq?.length) return null;

  return (
    <div className="m2-faq">
      {faq.map((item) => {
        const { q, a } = item as { q: string; a: string };
        return (
          <details className="m2-qa" key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        );
      })}
    </div>
  );
}
