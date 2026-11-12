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
  const [hero, timeline, cases, promises, book, contacts, reviews] =
    await Promise.all([
      getSection("hero"),
      getSection("timeline"),
      getSection("cases"),
      getSection("promises"),
      getSection("book"),
      getSection("contacts"),
      /* Два найновіші опубліковані відгуки з колекції reviews (етап 6);
         fallback — дефолти з content.ts. */
      getPublishedReviews(2),
    ]);

  return (
    <Home
      hero={hero.hero}
      timeline={timeline.timeline}
      cases={cases.cases}
      homeServiceOptions={cases.homeServiceOptions}
      promises={promises.promises}
      trust={promises.trust}
      reviews={reviews}
      book={book.book}
      contacts={contacts.contacts}
    />
  );
}
