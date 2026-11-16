import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ідеї свят — Жирафик, виїзні свята",
  description:
    "Ідеї для святкування: день народження, teen-party, випускний, свято для дорослих. Натхнення для вашого свята.",
  alternates: { canonical: "https://giraffe-teplyk.vercel.app/ideas" },
};

export default function IdeasPage() {
  return (
    <div className="m2-inner">
      <div className="m2-wrap">
        <div className="m2-inner__head">
          <h1 className="m2-inner__title">Ідеї свят</h1>
          <p className="m2-inner__lede">
            Натхнення для вашого свята: сценарії, теми та формати для різних
            вікових груп.
          </p>
        </div>
        <div className="m2-notecard">
          <b>Розділ у розробці.</b> Скоро тут з&apos;являться ідеї та сценарії
          свят. А поки — перегляньте наші{" "}
          <Link href="/services" className="m2-back">
            послуги
          </Link>{" "}
          та{" "}
          <Link href="/packages" className="m2-back">
            готові комплекси
          </Link>
          .
        </div>
      </div>
    </div>
  );
}