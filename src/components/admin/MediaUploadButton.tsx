"use client";

import { useRef, useState } from "react";
import styles from "@/styles/admin/AdminNews.module.css";

/** Кнопка «Завантажити файл»: відкриває file-picker, відправляє на
 *  /api/admin/media (валідація типу/розміру на сервері) і віддає URL
 *  назад у батьківську форму. Безпечне завантаження — ADM-01. */
export default function MediaUploadButton({
  onUploaded,
  label = "Завантажити файл",
  accept = "image/jpeg,image/png,image/gif,image/webp,image/avif",
}: {
  onUploaded: (url: string, fileName: string) => void;
  label?: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setBusy(true);
    setError("");
    try {
      const configRes = await fetch("/api/admin/media/upload-config", {
        cache: "no-store",
        credentials: "include",
      });
      if (!configRes.ok) throw new Error("Не вдалося підготувати завантаження");
      const config = (await configRes.json()) as {
        storage: "mongo" | "cloudinary";
        uploadUrl?: string;
        fields?: Record<string, string>;
      };

      if (config.storage === "cloudinary") {
        if (!config.uploadUrl || !config.fields) {
          throw new Error("Некоректна конфігурація Cloudinary");
        }
        const direct = new FormData();
        direct.append("file", file);
        for (const [key, value] of Object.entries(config.fields)) {
          direct.append(key, value);
        }
        const uploaded = await fetch(config.uploadUrl, {
          method: "POST",
          body: direct,
        });
        const remote = (await uploaded.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        if (!uploaded.ok) {
          throw new Error(
            remote.error?.message || "Не вдалося завантажити файл у хмару",
          );
        }

        const confirmRes = await fetch("/api/admin/media/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ publicId: config.fields.public_id }),
        });
        const data = await confirmRes.json().catch(() => ({}));
        if (!confirmRes.ok) {
          throw new Error(data.error || "Не вдалося зберегти файл у медіатеці");
        }
        onUploaded(data.url as string, file.name);
        return;
      }

      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Не вдалося завантажити файл");
      }
      onUploaded(data.url as string, (data.filename as string) || file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка завантаження");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <button
        type="button"
        className={styles.addImageBtn}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Завантаження…" : label}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </>
  );
}
