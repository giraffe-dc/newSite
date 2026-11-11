import Image from "next/image";
import Link from "next/link";
import { CONTACTS, NAV } from "@/components/board/content";

export default function Header() {
  return (
    <header className="m2-head">
      <div className="m2-wrap m2-head__in">
        <Link className="m2-brand" href="/" aria-label="Жирафик — на головну">
          <Image
            src="/brand/logo.png"
            alt="Логотип «Жирафик»"
            width={52}
            height={52}
            priority
          />
          <b>ЖИРАФИК</b>
        </Link>

        <nav className="m2-nav" aria-label="Основна навігація">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link className="m2-btn m2-head__cta" href="/#book">
          Забронювати дату
        </Link>

        <details className="m2-mnav">
          <summary>Меню</summary>
          <div className="m2-mnav__panel">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/news-contacts">Новини</Link>
            <a href={`tel:${CONTACTS.tel}`}>{CONTACTS.phone}</a>
          </div>
        </details>
      </div>
    </header>
  );
}
