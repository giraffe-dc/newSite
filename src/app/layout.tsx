import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Rubik, Rubik_Mono_One } from "next/font/google";
import type React from "react";
import ChatWidget from "@/components/chat/ChatWidget";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { StatisticsCollector } from "@/components/StatisticsCollector";
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
  "Аніматори, ростові ляльки, VR-клас і PlayStation 4 з виїздом додому, у клас або на майданчик. Бронювання онлайн за 2 хвилини.";

export const metadata: Metadata = {
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
  ],
  icons: { icon: "/brand/favicon.png" },
  openGraph: {
    title,
    description,
    url: "https://giraffe-teplyk.vercel.app",
    siteName: "Жирафик",
    locale: "uk_UA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" className={`${rubik.variable} ${mono.variable}`}>
      <body>
        <div className="m2-page">
          <a className="m2-skip" href="#main">
            Перейти до вмісту
          </a>
          <SpeedInsights />
          <StatisticsCollector />
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <ChatWidget />
          <Analytics />
        </div>
      </body>
    </html>
  );
}
