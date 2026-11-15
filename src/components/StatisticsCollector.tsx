// src/components/StatisticsCollector.tsx
"use client";

// import { cookies } from 'next/headers'
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function StatisticsCollector() {
  const pathname = usePathname();

  useEffect(() => {
    // Збираємо статистику лише на продакшні — із дев-сервера (localhost) дані
    // не повинні потрапляти в колекцію statistics, інакше графік переглядів
    // замішаний із тестовими відвідами з локального розробки.
    if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
      return;
    }

    const collectStatistics = async () => {
      try {
        const referrer = document.referrer || null;
        const screen = { w: window.innerWidth, h: window.innerHeight };
        await fetch("/api/stats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ path: pathname, referrer, screen }),
        });
      } catch (error) {
        console.error("Failed to collect statistics:", error);
      }
    };

    collectStatistics();
  }, [pathname]);

  return null;
}
