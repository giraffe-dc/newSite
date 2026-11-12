import Link from "next/link";
import type { SectionData } from "@/lib/siteContent";
import { BOOK_HREF, CONTACTS, HERO } from "./content";

export default function Hero({
  hero = HERO,
  contacts = CONTACTS,
}: {
  hero?: SectionData<"hero">["hero"];
  contacts?: SectionData<"contacts">["contacts"];
}) {
  return (
    <section className="m2-hero" id="top" aria-labelledby="hero-title">
      <div className="m2-wrap m2-hero__grid">
        <div>
          <h1 id="hero-title">
            {hero.titleLead}
            <span>{hero.titleAccent}</span>
            {hero.titleTail}
          </h1>
          <p className="m2-hero__lead">{hero.lead}</p>
          <div className="m2-hero__actions">
            <Link className="m2-btn" href={BOOK_HREF}>
              {hero.cta}
            </Link>
            <a className="m2-hero__tel" href={`tel:${contacts.tel}`}>
              {contacts.phone}
            </a>
          </div>
          <div className="m2-hero__micro">
            {hero.micro.map((item) => (
              <span key={item.bold}>
                {item.before}
                <b>{item.bold}</b>
                {item.after}
              </span>
            ))}
          </div>
        </div>
        {/* <Board /> */}
      </div>
    </section>
  );
}
