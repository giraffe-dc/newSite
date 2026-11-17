"use client";

import { useCallback, useEffect, useState } from "react";
import MediaUploadButton from "@/components/admin/MediaUploadButton";
import styles from "@/styles/admin/AdminMedia.module.css";

interface MediaItem {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  uploadedBy?: string;
  createdAt: string;
  url: string;
}

/** Бібліотека завантажених зображень (ADM-01, MED-01): список, завантаження,
 *  копіювання URL і видалення. */
export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/media", {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Не вдалося завантажити список");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка завантаження");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!window.confirm("Видалити це зображення?")) return;
    try {
      const res = await fetch(`/api/admin/media/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Не вдалося видалити");
      }
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Помилка видалення");
    }
  }

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied((c) => (c === url ? null : c)), 2000);
    } catch {
      alert(url);
    }
  }

  if (loading) {
    return <div className={styles.loading}>Завантаження медіа…</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Медіа-бібліотека</h1>
        <p>
          Завантажені зображення зберігаються в базі даних — так вони доступні і
          локально, і на хостингу. Після завантаження скопіюйте URL і вставте в
          поле обкладинки/галереї новини або контенту.
        </p>
        <div className={styles.uploadRow}>
          <MediaUploadButton
            label="Завантажити зображення"
            onUploaded={() => load()}
          />
          <button
            type="button"
            className={styles.reload}
            onClick={() => load()}
          >
            Оновити список
          </button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
      </header>

      {items.length === 0 ? (
        <div className={styles.empty}>
          Зображень ще немає. Натисніть «Завантажити зображення».
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((item) => (
            <div key={item.id} className={styles.card}>
              {/* biome-ignore lint/performance/noImgElement: динамічний URL із БД, next/image потребує remotePatterns */}
              <img
                src={item.url}
                alt={item.filename}
                className={styles.thumb}
              />
              <div className={styles.info}>
                <div className={styles.name} title={item.filename}>
                  {item.filename}
                </div>
                <div className={styles.meta}>
                  {Math.round(item.size / 1024)} КБ ·{" "}
                  {new Date(item.createdAt).toLocaleDateString("uk-UA")}
                </div>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.copy}
                  onClick={() => handleCopy(item.url)}
                >
                  {copied === item.url ? "Скопійовано" : "Копіювати URL"}
                </button>
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => handleDelete(item.id)}
                >
                  Видалити
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
