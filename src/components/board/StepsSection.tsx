import { STEPS } from "./content";

export default function StepsSection() {
  return (
    <section className="m2-steps m2-sec" id="how" aria-labelledby="how-title">
      <div className="m2-wrap">
        <div className="m2-sec__head">
          <h2 id="how-title">Від дзвінка до свята — чотири кроки</h2>
        </div>
        <ol className="m2-steps__list">
          {STEPS.map((step) => (
            <li key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
