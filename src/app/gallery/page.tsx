import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Галерея та відгуки — Жирафик, виїзні свята",
  description:
    "Фото зі свят, реальні локації та відгуки замовників Мобільного Магістра Свята «Жирафик».",
  alternates: { canonical: "https://giraffe-teplyk.vercel.app/gallery" },
};

export default function GalleryPage() {
  return (
    <div className="m2-inner">
      <div className="m2-wrap">
        <div className="m2-inner__head">
          <h1 className="m2-inner__title">Галерея та відгуки</h1>
          <p className="m2-inner__lede">
            Фото зі свят і відгуки замовників. Кожне свято — реальна локація.
          </p>
        </div>
        <div className="m2-notecard">
          <b>Розділ у розробці.</b> Фотогалерея з&apos;явиться після збору
          матеріалів. А поки — перегляньте{" "}
          <Link href="/reviews" className="m2-back">
            відгуки
          </Link>
          .
        </div>
      </div>
    </div>
  );
}