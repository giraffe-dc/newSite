import type { SectionData } from "@/lib/siteContent";
import { FAQ } from "./content";

export default function FaqList({
  faq = FAQ,
}: {
  faq?: SectionData<"faq">["faq"];
}) {
  return (
    <div className="m2-faq">
      {faq.map((item, index) => (
        <details className="m2-qa" key={item.q} open={index === 0}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}
