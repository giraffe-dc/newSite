import Image from "next/image";
import Link from "next/link";
import { CONTACTS } from "@/components/board/content";
import type { SectionData } from "@/lib/siteContent";

const LINKS = [
  // { href: "/", label: "Головна" },
  { href: "/services", label: "Послуги" },
  { href: "/assistant", label: "Підбір програми" },
  { href: "/packages", label: "Пакети" },
  { href: "/gallery", label: "Галерея" },
  { href: "/reviews", label: "Відгуки" },
  { href: "/news-contacts", label: "Новини й контакти" },
  { href: "/calculator", label: "Збери сам" },
  { href: "/privacy", label: "Конфіденційність" },
  { href: "/terms", label: "Умови" },
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
        {(contacts.whatsapp ||
          contacts.telegram ||
          contacts.facebook ||
          contacts.instagram ||
          contacts.tiktok) && (
          <div className="m2-foot__socials">
            {contacts.whatsapp && (
              <a
                href={contacts.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            )}
            {contacts.telegram && (
              <a
                href={contacts.telegram}
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram
              </a>
            )}
            {contacts.facebook && (
              <a
                href={contacts.facebook}
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook
              </a>
            )}
            {contacts.instagram && (
              <a
                href={contacts.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
            )}
            {contacts.tiktok && (
              <a
                href={contacts.tiktok}
                target="_blank"
                rel="noopener noreferrer"
              >
                TikTok
              </a>
            )}
          </div>
        )}
      </div>
    </footer>
  );
}
