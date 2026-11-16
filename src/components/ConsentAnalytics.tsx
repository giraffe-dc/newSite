"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { StatisticsCollector } from "@/components/StatisticsCollector";
import { getCookieConsent } from "@/components/CookieBanner";

/** Умовно завантажує аналітику на основі згоди користувача (cookie-банер). */
export default function ConsentAnalytics() {
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => {
      const c = getCookieConsent();
      setConsent(c ? c.analytics : null);
    };
    update();
    window.addEventListener("cookie-consent-changed", update);
    return () => window.removeEventListener("cookie-consent-changed", update);
  }, []);

  if (consent !== true) return null;

  return (
    <>
      <SpeedInsights />
      <StatisticsCollector />
      <Analytics />
    </>
  );
}