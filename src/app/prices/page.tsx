import { redirect } from "next/navigation";

/** Ціни тепер живуть на сторінці пакетів і в квитки послуг. */
export default function PricesPage() {
  redirect("/packages");
}
