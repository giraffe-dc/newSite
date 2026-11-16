"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/CookieBanner.module.css";

const CONSENT_KEY = "cookie_consent";

export interface CookieConsent {
  analytics: boolean;
  updatedAt: string;
}

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (typeof parsed.analytics !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setCookieConsent(analytics: boolean): void {
  if (typeof window === "undefined") return;
  const value: CookieConsent = { analytics, updatedAt: new Date().toISOString() };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: value }));
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    const consent = getCookieConsent();
    if (!consent) setVisible(true);

    const handler = () => setVisible(false);
    window.addEventListener("cookie-consent-changed", handler);
    return () => window.removeEventListener("cookie-consent-changed", handler);
  }, []);

  if (!visible) return null;

  const acceptAll = () => {
    setCookieConsent(true);
    setVisible(false);
  };

  const acceptNecessary = () => {
    setCookieConsent(false);
    setVisible(false);
  };

  const saveCustom = () => {
    setCookieConsent(analytics);
    setVisible(false);
  };

  return (
    <div className={styles.banner} role="dialog" aria-live="polite" aria-label="Налаштування cookies">
      <div className={styles.inner}>
        <p className={styles.text}>
          Ми використовуємо cookies для необхідних функцій сайту та аналітики
          (Vercel Analytics, власна статистика). Ви можете прийняти всі або
          обрати лише необхідні. Детальніше — у{" "}
          <a href="/privacy" className={styles.link}>
            політиці конфіденційності
          </a>
          .
        </p>

        {showDetails && (
          <div className={styles.details}>
            <label className={styles.checkbox}>
              <input type="checkbox" checked disabled />
              <span>Необхідні (завжди увімкнені)</span>
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
              <span>Аналітика (Vercel Analytics, статистика переглядів)</span>
            </label>
          </div>
        )}

        <div className={styles.actions}>
          {!showDetails && (
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setShowDetails(true)}
            >
              Налаштувати
            </button>
          )}
          {showDetails && (
            <button type="button" className={styles.btnSecondary} onClick={saveCustom}>
              Зберегти вибір
            </button>
          )}
          <button type="button" className={styles.btnSecondary} onClick={acceptNecessary}>
            Тільки необхідні
          </button>
          <button type="button" className={styles.btnPrimary} onClick={acceptAll}>
            Прийняти всі
          </button>
        </div>
      </div>
    </div>
  );
}