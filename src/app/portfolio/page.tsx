import { redirect } from "next/navigation";

/** Старий URL: відгуки жили тут до появи канонічної сторінки /reviews. */
export default function PortfolioPage() {
  redirect("/reviews");
}
