import type { Metadata } from "next";
import Link from "next/link";
import CoverSection from "@/components/board/CoverSection";
import { getSection } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Де можна провести святи — Жирафик, виїзні свята",
  description:
    "Куди приїжджаємо: квартири, приватні будинки, школи, дитячі майданчики та кафе. Дізнайтеся більше про зони діяльності.",
};

export const revalidate = 3600;

export default async function CoverPage() {
  const cover = await getSection("cover");
  return (
    <div className="m2-inner">
      <div className="m2-wrap">
        <div className="m2-inner__head">
          <h1 className="m2-inner__title">Куди приїжджаємо</h1>
          <p className="m2-inner__lede">
            Наші майстри працюють у різних локаціях. Обирайте зону для свята або
            довідуйтеся про можливі місця.
          </p>
        </div>

        <CoverSection
          heading={false}
          cover={cover.cover}
          coverNote={cover.coverNote}
        />

        <div className="m2-inline" style={{ marginTop: 40 }}>
          <Link className="m2-btn" href="/book">
            Забронювати дату
          </Link>
          <Link className="m2-btn m2-btn--ghost" href="/services">
            Пообірати послуги
          </Link>
        </div>
      </div>
    </div>
  );
}
