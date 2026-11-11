import { redirect } from "next/navigation";

/** Старий URL: форма бронювання жила тут до появи канонічної сторінки /book. */
export default function OrderPage() {
  redirect("/book");
}
