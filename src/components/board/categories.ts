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
