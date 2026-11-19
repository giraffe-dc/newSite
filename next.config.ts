import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Заголовки безпеки (аудит 15.11.2026).
// CSP: 'unsafe-inline' у script-src потрібен Next.js (інлайн-bootstrap без nonce);
// у проєкті немає жодного danger-сінка (dangerouslySetInnerHTML/innerHTML/eval — 0),
// тому базовий рівень захисту від зовнішніх скриптів і framejacking тут вистачає.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://va.vercel-insights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  // Прямий підписаний upload іде з браузера на API Cloudinary (CLO-05).
  // res.* додано для випадків, коли клієнт fetches доставлене зображення.
  "connect-src 'self' https://va.vercel-scripts.com https://va.vercel-insights.com https://api.cloudinary.com https://res.cloudinary.com",
  // Відео з галереї може віддаватися з CDN Cloudinary.
  "media-src 'self' https://res.cloudinary.com",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  images: {
    domains: ["localhost"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Адмінка не повинна індексуватися пошуковиками
        // (root metadata має robots: index — виправити його не можна,
        // бо admin-layout клієнтський).
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      // APK роздається з GitHub Releases (див. /app), на Vercel він не зберігається —
      // ліміт розміру файлу в репозиторії/деплої.
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
