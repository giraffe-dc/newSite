import { createHash, randomUUID } from "node:crypto";
import {
  ALLOWED_CLOUDINARY_FORMATS,
  MAX_MEDIA_BYTES,
  type MediaStorage,
  magicBytesMatch,
  mimeFromFormat,
} from "@/lib/mediaValidation";

/* Адаптер Cloudinary (CLO-03). Серверний модуль: api_secret ніколи
   не потрапляє у відповідь клієнту — браузер отримує лише підпис
   для одного завантаження з фіксованим public_id.

   Публічні URL контенту не змінюються: /api/media/<id> робить 302
   на результат buildDeliveryUrl(). Старі документи з `data` лишаються
   працювати через fallback у самому роуті. */

export type { MediaStorage } from "@/lib/mediaValidation";

type Config = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
};

export type CloudinaryAsset = {
  publicId: string;
  version: number;
  format: string;
  mime: string;
  bytes: number;
  width?: number;
  height?: number;
  secureUrl: string;
  createdAt?: string;
};

export type UploadTicket = {
  storage: "cloudinary";
  uploadUrl: string;
  fields: Record<string, string>;
};

export function mediaStorage(): MediaStorage {
  return process.env.MEDIA_STORAGE === "cloudinary" ? "cloudinary" : "mongo";
}

function config(): Config {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary Env не заповнено: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET",
    );
  }
  return {
    cloudName,
    apiKey,
    apiSecret,
    folder: process.env.CLOUDINARY_FOLDER?.trim() || "zhyrafyk/dev",
  };
}

function sign(cfg: Config, params: Record<string, string | number>): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1")
    .update(payload + cfg.apiSecret, "utf8")
    .digest("hex");
}

function basicAuth(cfg: Config): string {
  return `Basic ${Buffer.from(`${cfg.apiKey}:${cfg.apiSecret}`).toString("base64")}`;
}

function encodePublicId(publicId: string): string {
  return publicId.split("/").map(encodeURIComponent).join("/");
}

/** Одноразовий підпис для прямого завантаження з браузера.
 *  У `fields` входять усі параметри, які клієнт має надіслати разом із file. */
export function createUploadTicket(): UploadTicket {
  const cfg = config();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    public_id: `${cfg.folder}/${randomUUID()}`,
    timestamp,
    // Обмежуємо формати й розмір ще на боці Cloudinary.
    allowed_formats: ALLOWED_CLOUDINARY_FORMATS.join(","),
    // Телефони знімають 48–108 МП, а Free приймає до 25 МП.
    incoming: "c_limit,w_4000",
  };

  // Cloudinary не включає `incoming` у рядок для підпису (перевірено на
  // живому API): підписуємо лише ті поля, які він сам перевіряє. Сам
  // `incoming` усе одно надсилаємо — він застосовується як transform на ingest.
  const signedParams = {
    public_id: params.public_id,
    timestamp: params.timestamp,
    allowed_formats: params.allowed_formats,
  };

  return {
    storage: "cloudinary",
    uploadUrl: `https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`,
    fields: {
      ...Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, String(value)]),
      ),
      api_key: cfg.apiKey,
      signature: sign(cfg, signedParams),
    },
  };
}

function assetFromApi(data: Record<string, unknown>): CloudinaryAsset {
  const format = typeof data.format === "string" ? data.format : "";
  const mime = mimeFromFormat(format);
  if (!mime) throw new Error(`Непідтримуваний формат Cloudinary: ${format}`);
  return {
    publicId: String(data.public_id ?? ""),
    version: Number(data.version ?? 0),
    format,
    mime,
    bytes: Number(data.bytes ?? 0),
    width: typeof data.width === "number" ? data.width : undefined,
    height: typeof data.height === "number" ? data.height : undefined,
    secureUrl: String(data.secure_url ?? ""),
    createdAt:
      typeof data.created_at === "string" ? data.created_at : undefined,
  };
}

/** Перевірка ассета через Admin API після того, як браузер залив його напряму. */
export async function validateAsset(
  publicId: string,
): Promise<CloudinaryAsset> {
  const cfg = config();
  if (!publicId.startsWith(`${cfg.folder}/`)) {
    throw new Error("Недозволений public_id");
  }
  const url = `https://api.cloudinary.com/v1_1/${cfg.cloudName}/resources/image/upload/${encodePublicId(publicId)}`;
  const res = await fetch(url, {
    headers: { Authorization: basicAuth(cfg) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Cloudinary asset not found (${res.status})`);
  const raw = (await res.json()) as Record<string, unknown>;
  if (raw.type !== "upload" || raw.resource_type !== "image") {
    throw new Error("Недозволений тип ассета Cloudinary");
  }
  const created = Date.parse(String(raw.created_at ?? ""));
  if (Number.isFinite(created) && Date.now() - created > 10 * 60 * 1000) {
    throw new Error("Завантаження застаріло");
  }

  const asset = assetFromApi(raw);
  if (asset.bytes <= 0 || asset.bytes > MAX_MEDIA_BYTES) {
    throw new Error("Файл завеликий або порожній");
  }

  // Direct upload минає наш multipart-парсер, тому перевіряємо сигнатуру
  // перших байтів уже в хмарі (до того, як ассет стане публічним у контенті).
  const probe = await fetch(asset.secureUrl, {
    headers: { Range: "bytes=0-31" },
    cache: "no-store",
  });
  const prefix = new Uint8Array(await probe.arrayBuffer());
  if (!magicBytesMatch(asset.mime, prefix)) {
    throw new Error("Вміст файлу не відповідає його типу");
  }
  return asset;
}

export function buildDeliveryUrl(
  asset: Pick<CloudinaryAsset, "publicId" | "version" | "format">,
  width?: number,
  resourceType: "image" | "video" = "image",
): string {
  const cfg = config();
  const widthPart = width ? `c_limit,w_${width}/` : "";
  const transform = `${widthPart}q_auto,f_auto`;
  return `https://res.cloudinary.com/${cfg.cloudName}/${resourceType}/upload/${transform}/v${asset.version}/${asset.publicId}.${asset.format}`;
}

/** Best-effort видалення ассета разом із документом медіа. */
export async function destroyAsset(publicId: string): Promise<void> {
  const cfg = config();
  if (!publicId.startsWith(`${cfg.folder}/`)) return;
  const form = new FormData();
  form.append("public_id", publicId);
  form.append("timestamp", String(Math.floor(Date.now() / 1000)));
  form.append("invalidate", "true");
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/destroy`,
    { method: "POST", headers: { Authorization: basicAuth(cfg) }, body: form },
  );
  if (!res.ok) throw new Error(`Cloudinary destroy failed (${res.status})`);
}
