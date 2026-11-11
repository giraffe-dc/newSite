import type { Metadata } from "next";
import Link from "next/link";
import BookingSection from "@/components/board/BookingSection";
import { CONTACTS } from "@/components/board/content";

export const metadata: Metadata = {
  title: "Забронювати свято — Жирафик",
  description:
    "Залиште дату, адресу й контакт. Відповідаємо протягом години щодня з 9:00 до 21:00.",
};

export default function BookPage() {
  return (
    <div className="m2-inner">
      <div className="m2-wrap">
        <div className="m2-inner__head">
          <h1 className="m2-inner__title">Забронювати свято</h1>
          <p className="m2-inner__lede">
            Форма на сайті або дзвінок: {CONTACTS.phone}. Відповідаємо протягом
            години {CONTACTS.hours}.
          </p>
        </div>
      </div>

      <BookingSection />

      <div className="m2-wrap">
        <div className="m2-inline">
          <Link className="m2-btn m2-btn--ghost" href="/services">
            Що ми привозимо
          </Link>
          <Link className="m2-btn m2-btn--ghost" href="/packages">
            Готові пакети
          </Link>
        </div>
      </div>
    </div>
  );
}
