import type { Metadata } from "next";
import Link from "next/link";
import CoverSection from "@/components/board/CoverSection";
import FaqSection from "@/components/board/FaqSection";
import StepsSection from "@/components/board/StepsSection";
import { getSection } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Як ми працюємо — Жирафик, виїзні свята",
  description:
    "Від заявки до свята: чотири кроки, куди приїжджаємо, що потрібно підготувати на місці та як відбувається оплата.",
};

export const revalidate = 3600;

export default async function AboutPage() {
  const [steps, cover, faq] = await Promise.all([
    getSection("steps"),
    getSection("cover"),
    getSection("faq"),
  ]);
  return (
    <div className="m2-inner">
      <div className="m2-wrap">
        <div className="m2-inner__head">
          <h1 className="m2-inner__title">Свято приїжджає до вас</h1>
          <p className="m2-inner__lede">
            Ми не чекаємо гостей у закладі — команда привозить програму,
            костюми, реквізит і обладнання за вашою адресою. Усе розгортаємо на
            місці й забираємо після свята.
          </p>
        </div>
        <div className="m2-prose">
          <p>
            Формат підбираємо під вік дітей і приміщення: аніматори, ростові
            ляльки, VR-клас або PlayStation 4. Можна взяти готовий пакет або
            зібрати власний.
          </p>
          <p>
            Нижче — як виглядає шлях від заявки до свята, куди ми виїжджаємо й
            відповіді на питання, які ставлять найчастіше.
          </p>
        </div>
        <div className="m2-inline" style={{ marginTop: 28 }}>
          <Link className="m2-btn" href="/#book">
            Забронювати дату
          </Link>
          <Link className="m2-btn m2-btn--ghost" href="/services">
            Що ми привозимо
          </Link>
        </div>
      </div>

      <StepsSection steps={steps.steps} />
      <CoverSection cover={cover.cover} coverNote={cover.coverNote} />
      <FaqSection faq={faq.faq} />
    </div>
  );
}
