import Home from "@/components/board/Home";

/** Головна сторінка — композиція варіанта Б (docs/home-rework-demo-b.html).
 *  Дані: components/board/content.ts
 *  Секції: Hero → Сценарій дня → Підбір випадку → Гарантії → Відгуки →
 *          Перевірка дати → Бронювання (без дублювання сторінок).
 *
 *  Метадані тут не експортуються свідомо: title/description/keywords/OG/Twitter
 *  на всіх сторінках задає src/app/layout.tsx, щоб головна не розходилася з
 *  соціальними картками. Власні title/description мають лише вкладені сторінки.
 */
export default function HomePage() {
  return <Home />;
}
