import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";

export const metadata: Metadata = {
  title: "Мобільний додаток — Жирафик",
  description:
    "Встановіть мобільний додаток «Жирафик» на Android або додайте сайт на головний екран iPhone. Каталог свят, розрахунок, бронювання й контакти.",
  alternates: { canonical: "https://giraffe-teplyk.vercel.app/app" },
};

export const dynamic = "force-dynamic";

type Release = {
  versionName: string;
  versionCode: number;
  changelog: string[];
  publishedAt: string;
  sha256?: string;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://giraffe-teplyk.vercel.app";

export default async function AppPage() {
  let release: Release | null = null;
  let qr = "";
  try {
    const raw = await readFile(
      path.join(process.cwd(), "public", "app", "version.json"),
      "utf8",
    );
    release = JSON.parse(raw) as Release;
    qr = await QRCode.toDataURL(`${SITE_URL}/app/giraffe-mobile.apk`, {
      width: 220,
      margin: 1,
      color: { dark: "#123B28", light: "#FFFFFF" },
    });
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
                href="/app/giraffe-mobile.apk"
                download="giraffe-mobile.apk"
              >
                Завантажити APK
              </a>
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
          <h2>Як встановити на iPhone</h2>
          <div className="m2-prose">
            <ol>
              <li>Відкрийте сайт у Safari.</li>
              <li>Натисніть «Поділитися» (квадрат зі стрілкою).</li>
              <li>Оберіть «На головний екран» і підтвердьте.</li>
            </ol>
            <p>
              Після цього додаток з&apos;явиться на головному екрані як звичайна іконка.
              <a className="m2-btn m2-btn--ghost m2-btn--sm" href="/">
                Відкрити мобільну версію
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
