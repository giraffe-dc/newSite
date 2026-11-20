import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/mongodb";

/**
 * Кабінет клієнта: легка автентифікація за телефоном без SMS-провайдера
 * (рішення власника, Етап 3 roadmap giraffe-mobile).
 *
 * Два режими видачі одноразового коду (колекція `otp_codes`, TTL 10 хв):
 * - **Номер уже прив'язаний до Telegram** (`client_telegrams`) — код
 *   надсилається в приватний чат бота чату (`sendChatBotMessage`); клієнт
 *   вводить його в додатку. Доведення володіння — той самий Telegram.
 * - **Перший вхід** — додаток відкриває deep link
 *   `https://t.me/<бот>?start=otp_<id>`; webhook бота при `/start` створює
 *   прив'язку `phone ↔ chatId` і позначає код підтвердженим; додаток
 *   опитує `verify` без коду до успіху. ⚠️ Обмеження без SMS: перше
 *   прив'язування виграє «гонку» — хто першим клікнув посилання, той і
 *   володіє номером у кабінеті (вікно існує лише до першого входу).
 *
 * Fail-closed: без `NEXTAUTH_SECRET` жоден код не видається (як і в auth.ts).
 */

export const OTP_TTL_MS = 10 * 60_000;

export interface OtpDoc {
  _id: string;
  phone: string;
  codeHash: string;
  createdAt: string;
  expiresAt: Date;
  attempts: number;
  /** Підтверджено через deep link у Telegram (перший вхід). */
  confirmedAt?: string;
  boundChatId?: number;
  /** null/відсутнє — код ще активний. */
  consumedAt?: string | null;
}

/** Прив'язка номера до Telegram-чату. `_id` = нормалізований телефон. */
export interface ClientBindingDoc {
  _id: string;
  chatId: number;
  boundAt: string;
  lastLoginAt?: string;
}

function otpSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not defined");
  return secret;
}

/**
 * Нормалізація до `+380XXXXXXXXX`. Приймає «+380…», «0…», «380…»,
 * старий формат «8 (096)…» і будь-які розділювачі. `null` — якщо це
 * не український мобільний номер.
 */
export function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/\D/g, "");
  let national: string | null = null;
  if (digits.length === 12 && digits.startsWith("380")) national = digits.slice(3);
  else if (digits.length === 10 && digits.startsWith("0")) national = digits.slice(1);
  else if (digits.length === 9) national = digits;
  else if (digits.length === 11 && digits.startsWith("80")) national = digits.slice(2);
  if (!national || !/^[1-9]\d{8}$/.test(national)) return null;
  return `+380${national}`;
}

/** 9 цифр національного номера — для зіставлення зі старими заявками. */
export function national9(normalized: string): string {
  return normalized.slice(4);
}

/**
 * Фільтр `find()` для заявок: цифровий хвіст `phone` у базі збігається з
 * національним номером (покриває будь-який формат запису: «+38 (096)…»,
 * «096…», «8 (096)…»). Збіг за останніми 9 цифрами — ідентичність номера.
 *
 * Реалізація через `$regexFindAll` + `$reduce`: усі digit-run разом — це
 * ті самі цифри, що й `phone.replace(/\D/g, "")`, але без неіснуючого в
 * MongoDB `$regexReplaceAll` (перевірено на 7.0: такого оператора нема).
 * Гілка `$expr` не використовує індекс — для нових заявок першою йде
 * `phoneNorm`-гілка з індексом; legacy-скан по дрібній колекції заявок.
 */
export function ordersPhoneFilter(phone: string): Record<string, unknown> {
  const digitsOf = (path: string) => ({
    $let: {
      vars: {
        d: {
          $reduce: {
            input: {
              $regexFindAll: {
                input: {
                  $cond: [{ $eq: [{ $type: path }, "string"] }, path, ""],
                },
                regex: "[0-9]+",
              },
            },
            initialValue: "",
            in: { $concat: ["$$value", "$$this.match"] },
          },
        },
      },
      in: {
        $substrCP: [
          "$$d",
          { $max: [0, { $subtract: [{ $strLenCP: "$$d" }, 9] }] },
          9,
        ],
      },
    },
  });

  const legacy = { $expr: { $eq: [digitsOf("$phone"), national9(phone)] } };
  // $or: перша гілка — індекс phoneNorm (нові заявки), друга — $expr для
  // старих записів у будь-якому форматі телефону.
  return { $or: [{ phoneNorm: phone }, legacy] };
}

function hashOtp(phone: string, code: string): string {
  return createHash("sha256")
    .update(`${phone}:${code}:${otpSecret()}`)
    .digest("hex");
}

export function otpCodeMatches(otp: OtpDoc, code: string): boolean {
  const a = Buffer.from(hashOtp(otp.phone, code), "hex");
  const b = Buffer.from(otp.codeHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Маскування для повідомлень у Telegram: `+380•••••79`. */
export function maskPhone(phone: string): string {
  const n = normalizePhone(phone);
  if (!n) return phone;
  return `+380${"•".repeat(5)}${n.slice(-2)}`;
}

let indexesReady = false;

/** Лениві індекси (патерн ensureChatIndexes): TTL для кодів + пошук за номером. */
export async function ensureClientAuthIndexes(): Promise<void> {
  if (indexesReady) return;
  const db = await getDb();
  await Promise.all([
    db
      .collection("otp_codes")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("otp_codes").createIndex({ phone: 1, createdAt: -1 }),
    // Нові заявки мають phoneNorm (індекс → кабінет без повного сканування);
    // старі без нього ловить $expr-гілка ordersPhoneFilter.
    db.collection("orders").createIndex({ phoneNorm: 1, createdAt: -1 }),
  ]);
  indexesReady = true;
}

/** Створити одноразовий код для номера. Попередні активні коди не
 *  видаляються свідомо: `findActiveOtp` бере найновіший, решта згорає по TTL. */
export async function createOtp(
  phone: string,
): Promise<{ id: string; code: string }> {
  const db = await getDb();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const id = randomBytes(16).toString("hex");
  await db.collection<OtpDoc>("otp_codes").insertOne({
    _id: id,
    phone,
    codeHash: hashOtp(phone, code),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    attempts: 0,
  });
  return { id, code };
}

export async function findActiveOtp(phone: string): Promise<OtpDoc | null> {
  const db = await getDb();
  return db.collection<OtpDoc>("otp_codes").findOne(
    {
      phone,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { sort: { createdAt: -1 } },
  );
}

export async function consumeOtp(otpId: string): Promise<void> {
  const db = await getDb();
  await db
    .collection<OtpDoc>("otp_codes")
    .updateOne({ _id: otpId }, { $set: { consumedAt: new Date().toISOString() } });
}

/** Невірна спроба: $inc attempts; повертає після-інкрементне значення. */
export async function failOtpAttempt(otpId: string): Promise<number> {
  const db = await getDb();
  const res = await db
    .collection<OtpDoc>("otp_codes")
    .findOneAndUpdate(
      { _id: otpId },
      { $inc: { attempts: 1 } },
      { returnDocument: "after" },
    );
  return res?.attempts ?? 1;
}

export async function getBinding(phone: string): Promise<ClientBindingDoc | null> {
  const db = await getDb();
  return db
    .collection<ClientBindingDoc>("client_telegrams")
    .findOne({ _id: phone });
}

/** Підтвердити прив'язку з deep link (`/start otp_<id>` у бота чату).
 *  Відмова, якщо номер уже прив'язаний до іншого чату — це захист від
 *  захоплення активного кабінету. Ідемпотентно для того самого чату. */
export async function confirmOtpByLink(
  otpId: string,
  chatId: number,
): Promise<
  { ok: true; phone: string } | { ok: false; reason: "not-found" | "bound" }
> {
  const db = await getDb();
  const otp = await db.collection<OtpDoc>("otp_codes").findOne({ _id: otpId });
  if (!otp || otp.consumedAt || otp.expiresAt.getTime() <= Date.now()) {
    return { ok: false, reason: "not-found" };
  }
  if (otp.confirmedAt) {
    return otp.boundChatId === chatId
      ? { ok: true, phone: otp.phone }
      : { ok: false, reason: "bound" };
  }
  const binding = await getBinding(otp.phone);
  if (binding && binding.chatId !== chatId) {
    return { ok: false, reason: "bound" };
  }
  if (!binding) {
    await db.collection<ClientBindingDoc>("client_telegrams").insertOne({
      _id: otp.phone,
      chatId,
      boundAt: new Date().toISOString(),
    });
  }
  await db
    .collection<OtpDoc>("otp_codes")
    .updateOne(
      { _id: otpId },
      { $set: { confirmedAt: new Date().toISOString(), boundChatId: chatId } },
    );
  return { ok: true, phone: otp.phone };
}

/** Оновити час останнього успішного входу (best-effort). */
export async function touchLogin(phone: string): Promise<void> {
  const db = await getDb();
  await db
    .collection<ClientBindingDoc>("client_telegrams")
    .updateOne(
      { _id: phone },
      { $set: { lastLoginAt: new Date().toISOString() } },
    );
}

let botUsernameCache: string | null = null;

/** Ім'я бота чату для deep link: спершу env `TELEGRAM_CHAT_BOT_USERNAME`,
 *  інакше один раз getMe (кеш назавжди — ім'я бота не змінюється). */
export async function chatBotUsername(): Promise<string | null> {
  const fromEnv = process.env.TELEGRAM_CHAT_BOT_USERNAME?.trim().replace(/^@/, "");
  if (fromEnv) return fromEnv;
  if (botUsernameCache) return botUsernameCache;
  const token = process.env.TELEGRAM_CHAT_BOT_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = (await res.json()) as {
      ok?: boolean;
      result?: { username?: string };
    };
    const username = data?.ok ? data.result?.username : undefined;
    if (username) {
      botUsernameCache = username;
      return username;
    }
  } catch (error) {
    console.error("clientAuth: getMe не вдався", error);
  }
  return null;
}
