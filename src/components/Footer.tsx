import Image from "next/image";
import Link from "next/link";
import { CONTACTS } from "@/components/board/content";
import type { SectionData } from "@/lib/siteContent";

const LINKS = [
  { href: "/services", label: "Послуги" },
  { href: "/packages", label: "Пакети" },
  { href: "/calculator", label: "Кошторис" },
  { href: "/reviews", label: "Відгуки" },
  { href: "/about", label: "Про команду" },
  { href: "/news-contacts", label: "Новини й контакти" },
];

export default function Footer({
  contacts = CONTACTS,
}: {
  contacts?: SectionData<"contacts">["contacts"];
}) {
  return (
    <footer className="m2-foot">
      <div className="m2-wrap m2-foot__in">
        <div className="m2-foot__brand">
          <Image
            src="/brand/logo.png"
            alt="Логотип «Жирафик»"
            width={44}
            height={44}
          />
          <span>
            Мобільний магістр свята «Жирафик»
            <br />© с-ще Теплик 2026. Свято приїжджає до Вас
          </span>
        </div>
        <nav className="m2-foot__links" aria-label="Навігація у футері">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <a className="m2-foot__tel" href={`tel:${contacts.tel}`}>
          {contacts.phone}
        </a>
      </div>
    </footer>
  );
}
