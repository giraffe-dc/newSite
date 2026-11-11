import { type NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Order;

    if (!body?.customerName || !body?.phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("zhyrafyk");

    const nowIso = new Date().toISOString();
    const doc: Order = {
      customerName: body.customerName,
      phone: body.phone,
      whatsapp: body.whatsapp,
      date: body.date,
      time: body.time,
      eventAddress: body.eventAddress,
      eventType: body.eventType,
      childrenCount: body.childrenCount,
      notes: body.notes,
      items: body.items,
      packageId: body.packageId,
      packageName: body.packageName,
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

export async function GET() {
  try {
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
