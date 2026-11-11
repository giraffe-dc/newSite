import type { Metadata } from "next";
import Link from "next/link";
import PackagesGrid from "@/components/board/PackagesGrid";
import { getSection } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Готові пакети — Жирафик, виїзні свята",
  description:
    "Пакети «Міні», «Стандарт» і «VIP»: склад програми, тривалість і орієнтовні ціни. Можна зібрати власний формат із окремих послуг.",
};

export const revalidate = 3600;

export default async function PackagesPage() {
  const packages = await getSection("packages");
  return (
    <div className="m2-inner">
      <div className="m2-wrap">
        <div className="m2-inner__head">
          <h1 className="m2-inner__title">Готові пакети</h1>
          <p className="m2-inner__lede">
            Оберіть маршрут під своє свято — або зберіть власний із послуг. Ціни
            орієнтовні, остаточну суму підтвердить команда.
          </p>
        </div>

        <PackagesGrid
          packages={packages.packages}
          packageAddons={packages.packageAddons}
        />

        <div className="m2-inline" style={{ marginTop: 32 }}>
          <Link className="m2-btn" href="/#book">
            Забронювати дату
          </Link>
          <Link className="m2-btn m2-btn--ghost" href="/services">
            Обрати послуги окремо
          </Link>
        </div>
      </div>
    </div>
  );
}
