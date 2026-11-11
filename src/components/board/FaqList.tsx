import { FAQ } from "./content";

export default function FaqList() {
  return (
    <div className="m2-faq">
      {FAQ.map((item, index) => (
        <details className="m2-qa" key={item.q} open={index === 0}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}
