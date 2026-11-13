import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { sendTelegramMessage } from "@/lib/utils";
import type { Order } from "@/types";

function formatOrderForTelegram(order: Order) {
  const lines: string[] = [];
  lines.push("<b>Нова заявка на виїзд</b>");
  lines.push(`Ім'я: <b>${order.customerName}</b>`);
  lines.push(`Телефон: <b>${order.phone}</b>`);
  if (order.whatsapp) lines.push(`WhatsApp: <b>${order.whatsapp}</b>`);
  if (order.date) lines.push(`Дата події: <b>${order.date}</b>`);
  if (order.time) lines.push(`Час: <b>${order.time}</b>`);
  if (order.eventAddress)
    lines.push(`Адреса проведення: <b>${order.eventAddress}</b>`);
  if (order.eventType) lines.push(`Тип свята: <b>${order.eventType}</b>`);
  if (order.serviceName)
    lines.push(`Послуга: <b>${order.serviceName}</b>`);
  if (order.childrenCount)
    lines.push(`Кількість дітей: <b>${order.childrenCount}</b>`);
  if (order.packageName) lines.push(`Пакет: <b>${order.packageName}</b>`);
  if (order.items?.length) {
    lines.push("Послуги:");
    order.items.forEach((it, idx) => {
      lines.push(
        `${idx + 1}. ${it.serviceName}${it.quantity ? ` x${it.quantity}` : ""}${it.price ? ` (${it.price})` : ""}`,
      );
    });
  }
  if (order.notes) lines.push(`Коментар: ${order.notes}`);
  return lines.join("\n");
}

/** Телефон: +, цифри, пробіл, дефіс, дужки — щонайменше 7 символів
 *  (та сама regex-логіка, що була у старій формі-модалці). */
const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,}$/;

/** Ліміти полів: санітизація перед записом у базу (етап 4, п. 5). */
function cut(value: unknown, max: number): string {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Order;

    const customerName = cut(body?.customerName, 100);
    const phone = cut(body?.phone, 30);
    if (!customerName || !phone) {
      return NextResponse.json(
        { error: "Вкажіть ім'я та номер телефону" },
        { status: 400 },
      );
    }
    if (!PHONE_PATTERN.test(phone)) {
      return NextResponse.json(
        { error: "Введіть коректний номер телефону" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("zhyrafyk");

    const nowIso = new Date().toISOString();
    const doc: Order = {
      customerName,
      phone,
      whatsapp: cut(body.whatsapp, 30) || undefined,
      date: cut(body.date, 10),
      time: cut(body.time, 10),
      eventAddress: cut(body.eventAddress, 300),
      eventType: cut(body.eventType, 100),
      childrenCount:
        typeof body.childrenCount === "number" &&
        Number.isFinite(body.childrenCount) &&
        body.childrenCount >= 0
          ? Math.min(Math.trunc(body.childrenCount), 1000)
          : undefined,
      notes: cut(body.notes, 2000),
      items: Array.isArray(body.items)
        ? body.items.slice(0, 30).map((item) => ({
            serviceId: cut(item?.serviceId, 100) || undefined,
            serviceName: cut(item?.serviceName, 200),
            quantity:
              typeof item?.quantity === "number" && item.quantity > 0
                ? Math.min(Math.trunc(item.quantity), 1000)
                : undefined,
            price: cut(item?.price, 50) || undefined,
          }))
        : undefined,
      packageId: cut(body.packageId, 100) || undefined,
      packageName: cut(body.packageName, 200) || undefined,
      serviceName: cut(body.serviceName, 200) || undefined,
      status: "new",
      createdAt: nowIso,
    };

    const result = await db.collection<Order>("orders").insertOne(doc);
    const orderId = result.insertedId.toString();

    // send Telegram notification (best-effort)
    const message = formatOrderForTelegram(doc);
    sendTelegramMessage(message).catch(() => {});

    // send External notification (best-effort)
    const baseUrl = process.env.NOTIFICATIONS_BASE_URL;
    if (baseUrl) {
      await fetch(`${baseUrl}/api/notifications/incoming`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: process.env.NOTIFICATIONS_API_KEY,
          title: "Нова заявка на виїзд",
          message: `Замовлення #${orderId} від ${doc.customerName}`,
          type: "success",
          source: "website",
          metadata: doc,
        }),
      })
        .then((res) => console.log(res))
        .catch((err) => console.error("External notification error:", err));
    }

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Замовлення — приватні дані: лише адмін-кука з валідним JWT.
    const token = request.cookies.get("admin_token")?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const orders = await db
      .collection("orders")
      .find(
        {},
        {
          projection: {
            /* no sensitive fields */
          },
        },
      )
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
