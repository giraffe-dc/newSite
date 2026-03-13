import React from "react";
import Header from "@/components/Header";
import ChatWidget from "@/components/chat/ChatWidget";
import Footer from "@/components/Footer";
import { StatisticsCollector } from "@/components/StatisticsCollector";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata = {
  title: "Жирафик - Сімейний розважальний центр у Вінниці",
  description:
    "Найкращий сімейний розважальний центр 'Жирафик'. Святкування днів народження, ігрові зони, кафе та розваги для всієї родини у Вінниці.",
  keywords: ["Жирафик", "дитячий центр", "Вінниця", "день народження", "дитячі розваги", "сімейний відпочинок"],
  openGraph: {
    title: "Жирафик - Сімейний розважальний центр",
    description: "Ідеальне місце для дитячих свят та сімейного дозвілля.",
    url: "https://zhyrafyk.com.ua",
    siteName: "Жирафик",
    locale: "uk_UA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Жирафик - Сімейний розважальний центр",
    description: "Найкращі розваги для ваших дітей у Вінниці.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body>
        <SpeedInsights />
        <StatisticsCollector />
        <Header />
        <main>{children}</main>
        <ChatWidget />
        <Analytics />
        <Footer />
      </body>
    </html>
  );
}
