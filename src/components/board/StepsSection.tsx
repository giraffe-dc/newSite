import type { SectionData } from "@/lib/siteContent";
import { STEPS } from "./content";

export default function StepsSection({
  steps = STEPS,
}: {
  steps?: SectionData<"steps">["steps"];
}) {
  if (!steps?.length) return null;

  return (
    <section className="m2-steps m2-sec" id="how" aria-labelledby="how-title">
      <div className="m2-wrap">
        <div className="m2-sec__head">
          <h2 id="how-title">Від дзвінка до свята — чотири кроки</h2>
        </div>
        <ol className="m2-steps__list">
          {steps.map((step) => {
            const { title, text } = step as { title: string; text: string };
            return (
              <li key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
