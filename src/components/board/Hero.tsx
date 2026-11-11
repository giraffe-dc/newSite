import Link from "next/link";
import Board from "./Board";
import { BOOK_HREF, CONTACTS, HERO } from "./content";

export default function Hero() {
  return (
    <section className="m2-hero" id="top" aria-labelledby="hero-title">
      <div className="m2-wrap m2-hero__grid">
        <div>
          <h1 id="hero-title">
            {HERO.titleLead}
            <span>{HERO.titleAccent}</span>
            {HERO.titleTail}
          </h1>
          <p className="m2-hero__lead">{HERO.lead}</p>
          <div className="m2-hero__actions">
            <Link className="m2-btn" href={BOOK_HREF}>
              {HERO.cta}
            </Link>
            <a className="m2-hero__tel" href={`tel:${CONTACTS.tel}`}>
              {CONTACTS.phone}
            </a>
          </div>
          <div className="m2-hero__micro">
            {HERO.micro.map((item) => (
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
