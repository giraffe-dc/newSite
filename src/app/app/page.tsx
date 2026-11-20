import type { Metadata } from "next";
import QRCode from "qrcode";
import {
  APK_FALLBACK,
  getMobileRelease,
  type MobileRelease,
} from "@/lib/mobileRelease";

export const metadata: Metadata = {
  title: "Мобільний додаток — Жирафик",
  description:
    "Встановіть мобільний додаток «Жирафик» на Android або додайте сайт на головний екран iPhone. Каталог свят, розрахунок, бронювання й контакти.",
  alternates: { canonical: "https://giraffe-teplyk.vercel.app/app" },
};

export const dynamic = "force-dynamic";

// APK не зберігається на Vercel (ліміт розміру) — він лежить у GitHub Releases.
// Актуальна версія — у БД сайту (див. @/lib/mobileRelease), fallback — файл.

// URL PWA-версії для iPhone (окремий Vercel-проєкт з web-експорту giraffe-mobile).
// Порожній рядок — кнопка «Відкрити PWA» на сторінці ховається.
const PWA_URL = process.env.NEXT_PUBLIC_PWA_URL || "";

export default async function AppPage() {
  let release: MobileRelease | null = null;
  let qr = "";
  let apkUrl = APK_FALLBACK;
  try {
    release = await getMobileRelease();
    if (release) {
      apkUrl = release.apkUrl || APK_FALLBACK;
      qr = await QRCode.toDataURL(apkUrl, {
        width: 220,
        margin: 1,
        color: { dark: "#123B28", light: "#FFFFFF" },
      });
    }
  } catch (error) {
    console.error("app page: не вдалося підготувати сторінку", error);
  }

  return (
    <div className="m2-inner">
      <div className="m2-wrap">
        <div className="m2-inner__head">
          <h1 className="m2-inner__title">Додаток «Жирафик» 🦒</h1>
          <p className="m2-inner__lede">
            Каталог свят, розрахунок вартості, бронювання й зв&apos;язок із командою —
            просто під рукою.
          </p>
        </div>

        <section className="m2-sec" style={{ marginTop: 0 }}>
          <div className="m2-two">
            <div style={{ textAlign: "center" }}>
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qr}
                  alt="QR-код для завантаження додатка на телефон"
                  width={220}
                  height={220}
                  style={{ background: "#fff", padding: 8, borderRadius: 12 }}
                />
              ) : (
                <p>QR-код тимчасово недоступний — скористайтеся кнопкою нижче.</p>
              )}
            </div>
            <div>
              <h2>Android</h2>
              <p>
                Наведіть камеру телефона на QR-код або натисніть кнопку — почнеться
                завантаження APK. Після завантаження відкрийте файл і дозвольте
                встановлення з невідомих джерел.
              </p>
              <a
                className="m2-btn m2-btn--green"
                href={apkUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Завантажити APK
              </a>
              <p style={{ marginTop: 10, fontSize: 12, color: "#5C6B62" }}>
                Файл хоститься на GitHub Releases — з сайту він не завантажується.
              </p>
              {release ? (
                <p style={{ marginTop: 16, fontSize: 13 }}>
                  Версія <strong>{release.versionName}</strong> (збірка {release.versionCode}) ·
                  оновлено {release.publishedAt}
                </p>
              ) : null}
            </div>
          </div>
          {release?.changelog?.length ? (
            <div className="m2-prose" style={{ marginTop: 24 }}>
              <h3>Що нового</h3>
              <ul>
                {release.changelog.map((line, i) => (
                  <li key={`${i}-${line}`}>{line}</li>
                ))}
              </ul>
              {release.sha256 ? (
                <p style={{ fontSize: 11, wordBreak: "break-all" }}>
                  Контрольна сума SHA-256: <code>{release.sha256}</code>
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="m2-sec">
          <h2>Як встановити на iPhone (PWA)</h2>
          <div className="m2-prose">
            <p>
              Додаток для iPhone — це PWA-версія: відкривається з іконки на екрані,
              без Safari, і працює офлайн для перегляду каталогу.
            </p>
            <ol>
              <li>Відкрийте PWA-версію в Safari (кнопка нижче або посилання).</li>
              <li>Натисніть «Поділитися» (квадрат зі стрілкою).</li>
              <li>Оберіть «На головний екран» і підтвердьте.</li>
            </ol>
            <p>
              Після цього додаток з&apos;явиться на головному екрані як звичайна іконка
              і відкриватиметься на весь екран.
            </p>
            <p>
              {PWA_URL ? (
                <a
                  className="m2-btn m2-btn--green"
                  href={PWA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Відкрити PWA-версію
                </a>
              ) : null}{" "}
              <a className="m2-btn m2-btn--ghost m2-btn--sm" href="/">
                Відкрити мобільну версію сайту
              </a>
            </p>
          </div>
        </section>

        <section className="m2-sec">
          <h2>Потрібна допомога?</h2>
          <div className="m2-prose">
            <p>
              Напишіть у чат на сайті або зателефонуйте:{" "}
              <a href="tel:+380961878579">+38 (096) 187-85-79</a>. Щодня з 09:00 до 21:00.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
