/* Категорії каталогу послуг — єдине джерело для фільтрів публічного
   каталогу (ServicesCatalog) і селекта «Категорія» в адмінці. */

export const SERVICE_CATEGORIES: ReadonlyArray<{ id: string; label: string }> =
  [
    { id: "animators", label: "Аніматорські програми" },
    { id: "puppets", label: "Ростові ляльки" },
    { id: "shows", label: "Шоу-програми" },
    { id: "gaming", label: "VR & PS4 / GAME PORTAL" },
    { id: "workshops", label: "Майстер-класи" },
    { id: "extras", label: "Святкові доповнення" },
    { id: "seasonal", label: "Сезонні (Новий рік)" },
  ];

/** Назва категорії за id (для адмінки та підписів). */
export function categoryLabel(id: string): string {
  return SERVICE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

/** Демо-зображення категорії (SVG-заглушка). Якщо в послуги є своє фото
 *  (`images[0]`) — воно має пріоритет; цей файл лише фолбек (MED-01:
 *  замінити на реальні фото з заходів, коли надасть власник). */
export const DEMO_IMAGES: Record<string, string> = {
  animators: "/brand/demo/animators.svg",
  puppets: "/brand/demo/puppets.svg",
  shows: "/brand/demo/shows.svg",
  gaming: "/brand/demo/gaming.svg",
  workshops: "/brand/demo/workshops.svg",
  extras: "/brand/demo/extras.svg",
  seasonal: "/brand/demo/seasonal.svg",
};

/** Фото послуги: власне зображення → демо-заглушка категорії → універсальна. */
export function serviceImage(service: {
  images?: readonly string[];
  category?: string;
}): string {
  return (
    service.images?.[0] ||
    DEMO_IMAGES[service.category || ""] ||
    DEMO_IMAGES.animators
  );
}
