import type { MetadataRoute } from "next";
import { NewsService } from "@/lib/services/NewsService";

const BASE_URL = "https://giraffe-teplyk.vercel.app";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 1 },
  { url: `${BASE_URL}/services`, changeFrequency: "weekly", priority: 0.9 },
  { url: `${BASE_URL}/assistant`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE_URL}/packages`, changeFrequency: "weekly", priority: 0.9 },
  { url: `${BASE_URL}/calculator`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE_URL}/reviews`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${BASE_URL}/faq`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE_URL}/cover`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE_URL}/ideas`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE_URL}/gallery`, changeFrequency: "monthly", priority: 0.6 },
  {
    url: `${BASE_URL}/news-contacts`,
    changeFrequency: "weekly",
    priority: 0.7,
  },
  { url: `${BASE_URL}/book`, changeFrequency: "monthly", priority: 0.9 },
  { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let newsRoutes: MetadataRoute.Sitemap = [];
  try {
    const news = await NewsService.getAll();
    newsRoutes = news
      .map((raw) => {
        const item =
          raw as unknown as import("@/lib/services/NewsService").INews & {
            _id?: unknown;
          };
        const id = String(item._id ?? "");
        if (!id) return null;
        const lastModified =
          item.date instanceof Date
            ? item.date
            : typeof item.date === "string" || typeof item.date === "number"
              ? new Date(item.date)
              : undefined;
        return {
          url: `${BASE_URL}/news/${id}`,
          lastModified:
            lastModified && !Number.isNaN(lastModified.getTime())
              ? lastModified
              : undefined,
          changeFrequency: "monthly" as const,
          priority: 0.5,
        };
      })
      .filter((x) => x !== null) as MetadataRoute.Sitemap;
  } catch {
    // БД недоступна — повертаємо лише статичні маршрути.
  }

  return [...STATIC_ROUTES, ...newsRoutes];
}
