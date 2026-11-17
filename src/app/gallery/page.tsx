import type { Metadata } from "next";
import { BOOK_HREF, publishedOnly } from "@/components/board/content";
import Gallery, { type GalleryViewAlbum } from "@/components/board/Gallery";
import { getSection, type SectionData } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Галерея емоцій — Жирафик, фото та відео зі свят",
  description:
    "Альбоми зі свят Мобільного Магістра Свята «Жирафик»: аніматори, шоу, VR & PS4, майстер-класи та відеомоменти. Знайдіть ідею для свого свята.",
  alternates: { canonical: "https://giraffe-teplyk.vercel.app/gallery" },
};

export const revalidate = 3600;

type Services = SectionData<"services">["services"];
type Packages = SectionData<"packages">["packages"];

/**
 * Посилання на замовлення для альбому: serviceRef зберігається в адмінці
 * як `service:<id>` / `package:<id>` (вибір з каталогу, без ручного ID).
 * Повертаємо href і назву з актуального каталогу, якщо її не заповнено текстом.
 */
function resolveServiceRef(
  ref: string,
  services: Services,
  packages: Packages,
): { href?: string; label?: string } {
  const colon = ref.indexOf(":");
  if (colon < 1) return {};
  const kind = ref.slice(0, colon);
  const id = ref.slice(colon + 1);
  if (!id) return {};

  if (kind === "service") {
    const service = publishedOnly(services).find((item) => item.id === id);
    if (!service) return {};
    const params = new URLSearchParams();
    if (service.format) params.set("format", service.format);
    params.set("service", service.title);
    return { href: `${BOOK_HREF}?${params.toString()}`, label: service.title };
  }

  if (kind === "package") {
    const item = publishedOnly(packages).find((entry) => entry.id === id);
    if (!item) return {};
    const params = new URLSearchParams();
    if (item.format) params.set("format", item.format);
    params.set("package", item.id);
    params.set("packageName", item.name);
    params.set("programId", item.id);
    return { href: `${BOOK_HREF}?${params.toString()}`, label: item.name };
  }

  return {};
}

export default async function GalleryPage() {
  const [gallerySection, servicesSection, packagesSection, contactsSection] =
    await Promise.all([
      getSection("gallery"),
      getSection("services"),
      getSection("packages"),
      getSection("contacts"),
    ]);

  const albums: GalleryViewAlbum[] = publishedOnly(gallerySection.albums).map(
    (album) => {
      const resolved = album.serviceRef
        ? resolveServiceRef(
            album.serviceRef,
            servicesSection.services,
            packagesSection.packages,
          )
        : {};
      return {
        ...album,
        images: [...album.images],
        serviceLabel: album.serviceLabel || resolved.label || "",
        serviceHref: resolved.href,
      };
    },
  );

  return <Gallery albums={albums} contacts={contactsSection.contacts} />;
}
