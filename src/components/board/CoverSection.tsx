import { COVER, COVER_NOTE } from "./content";

export default function CoverSection({
  heading = true,
}: {
  heading?: boolean;
}) {
  return (
    <section
      className="m2-sec"
      id="cover"
      aria-labelledby={heading ? "cover-title" : undefined}
      aria-label={heading ? undefined : "Куди приїжджаємо"}
    >
      <div className="m2-wrap m2-cover">
        <div>
          {heading && (
            <div className="m2-sec__head">
              <h2 id="cover-title">Куди приїжджаємо</h2>
            </div>
          )}
          <ul className="m2-cover__list">
            {COVER.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="m2-note">
          <strong>{COVER_NOTE.title}</strong>
          <br />
          {COVER_NOTE.text}
        </div>
      </div>
    </section>
  );
}
