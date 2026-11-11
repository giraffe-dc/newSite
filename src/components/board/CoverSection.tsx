import type { SectionData } from "@/lib/siteContent";
import { COVER, COVER_NOTE } from "./content";

export default function CoverSection({
  heading = true,
  cover = COVER,
  coverNote = COVER_NOTE,
}: {
  heading?: boolean;
  cover?: SectionData<"cover">["cover"];
  coverNote?: SectionData<"cover">["coverNote"];
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
            {cover.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="m2-note">
          <strong>{coverNote.title}</strong>
          <br />
          {coverNote.text}
        </div>
      </div>
    </section>
  );
}
