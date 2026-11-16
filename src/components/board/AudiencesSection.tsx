import Link from "next/link";

/** Чотири аудиторії — блок головної за брифом редизайну.
 *  Допомагає клієнту за 5 секунд знайти свій формат свята. */
const AUDIENCES = [
  {
    emoji: "🎂",
    title: "Дитячі свята",
    text: "Тематичні аніматори, квести, шоу, майстер-класи.",
    href: "/services",
  },
  {
    emoji: "🎮",
    title: "Підліткам",
    text: "PS4, VR, неонові та ігрові програми.",
    href: "/services",
  },
  {
    emoji: "🎊",
    title: "Дорослим",
    text: "Привітання, ростові ляльки, сюрпризи, розваги.",
    href: "/services",
  },
  {
    emoji: "🎓",
    title: "Колективам",
    text: "Школи, садочки, випускні, сімейні заходи.",
    href: "/services",
  },
];

export default function AudiencesSection() {
  return (
    <section className="m2-sec" id="audiences" aria-labelledby="audiences-title">
      <div className="m2-wrap">
        <div className="m2-sec__head">
          <span className="m2-eyebrow">Для кого</span>
          <h2 id="audiences-title">Оберіть свій формат свята</h2>
          <p>
            Ми приїжджаємо до вас — додому, до школи, садочка, кафе чи на
            майданчик. Оберіть аудиторію, щоб побачити відповідні програми.
          </p>
        </div>
        <div className="m2-audiences">
          {AUDIENCES.map((a) => (
            <Link key={a.title} href={a.href} className="m2-audience">
              <div className="m2-audience__ico" aria-hidden="true">
                {a.emoji}
              </div>
              <h3>{a.title}</h3>
              <p>{a.text}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}