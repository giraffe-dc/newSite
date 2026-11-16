import type { Metadata } from "next";
import { Rubik, Rubik_Mono_One } from "next/font/google";
import type React from "react";
import ChatWidget from "@/components/chat/ChatWidget";
import ConsentAnalytics from "@/components/ConsentAnalytics";
import CookieBanner from "@/components/CookieBanner";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getSection } from "@/lib/siteContent";
import "./globals.css";
import "@/styles/global.css";

const rubik = Rubik({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-rubik",
});

const mono = Rubik_Mono_One({
  subsets: ["latin", "cyrillic"],
  weight: "400",
  display: "swap",
  variable: "--font-mono",
});

const title =
  "Жирафик — свято приїжджає додому | Виїзні аніматори, ростові ляльки, VR та PS4";
const description =
  "Аніматори, ростові ляльки, VR-клас і PlayStation 4 з виїздом додому, у клас або на майданчик. Бронювання онлайн за 2 хвилини. Теплик, Вінницька область, Україна. Свято приїжджає до Вас!";

export const metadata: Metadata = {
  metadataBase: new URL("https://giraffe-teplyk.vercel.app"),
  title,
  description,
  keywords: [
    "Жирафик",
    "виїзні свята",
    "аніматори на виїзд",
    "ростові ляльки",
    "VR на виїзд",
    "PlayStation 4",
    "день народження",
    "бронювання свята",
    "Теплик",
    "Вінницька область",
    "Україна",
  ],
  icons: { icon: "/brand/favicon.png" },
  alternates: { canonical: "https://giraffe-teplyk.vercel.app" },
  openGraph: {
    title,
    description,
    url: "https://giraffe-teplyk.vercel.app",
    siteName: "Жирафик",
    locale: "uk_UA",
    type: "website",
    images: [
      {
        url: "/brand/logo.png",
        width: 512,
        height: 512,
        alt: "Жирафик — свято приїжджає до Вас",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/brand/logo.png"],
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Контакти — з site_content (БД), з fallback на content.ts при помилці.
  const { contacts } = await getSection("contacts");

  return (
    <html lang="uk" className={`${rubik.variable} ${mono.variable}`}>
      <body>
        <div className="m2-page">
          <a className="m2-skip" href="#main">
            Перейти до вмісту
          </a>
          <ConsentAnalytics />
          <Header contacts={contacts} />
          <main id="main">{children}</main>
          <Footer contacts={contacts} />
          <ChatWidget />
          <CookieBanner />
        </div>
      </body>
    </html>
  );
}
