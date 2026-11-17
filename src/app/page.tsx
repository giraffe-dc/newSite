import { publishedOnly } from "@/components/board/content";
import Home from "@/components/board/Home";
import { getPublishedReviews } from "@/lib/reviews";
import { getSection } from "@/lib/siteContent";

/** Головна сторінка — композиція варіант Б (docs/home-rework-demo-b.html).
 *  Дані: секції site_content (fallback — content.ts), отримані пропсами.
 *  Секції: Hero → Сценарій дня → Підбір випадку → Гарантії → Відгуки →
 *          Перевірка дати → Бронювання (без дублювання сторінок).
 *
 *  Метадані тут не експортуються свідомо: title/description/keywords/OG/Twitter
 *  на всіх сторінках задає src/app/layout.tsx, щоб головна не розходилася з
 *  соціальними картками. Власні title/description мають лише вкладені сторінки.
 */

/** ISR 1 год; після правок у адмінці кеш скидає revalidatePath (Етап 1). */
export const revalidate = 3600;

export default async function HomePage() {
  const [
    hero,
    timeline,
    promises,
    book,
    contacts,
    reviews,
    packages,
    services,
    seasonalOffers,
  ] = await Promise.all([
    getSection("hero"),
    getSection("timeline"),
    getSection("promises"),
    getSection("book"),
    getSection("contacts"),
    getPublishedReviews(2),
    getSection("packages"),
    getSection("services"),
    getSection("seasonalOffers"),
  ]);

  return (
    <Home
      hero={hero.hero}
      timeline={timeline.timeline}
      promises={promises.promises}
      trust={promises.trust}
      reviews={reviews}
      book={book.book}
      contacts={contacts.contacts}
      packages={publishedOnly(packages.packages)}
      services={publishedOnly(services.services)}
      seasonalOffers={seasonalOffers}
    />
  );
}
