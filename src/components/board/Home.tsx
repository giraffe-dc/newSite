"use client";

import { useState } from "react";
import type { SectionData } from "@/lib/siteContent";
import BookingSection from "./BookingSection";
import CasePicker from "./CasePicker";
import type { ReviewItem } from "./content";
import { DATE_SLOTS } from "./content";
import Hero from "./Hero";
import PromisesSection from "./PromisesSection";
import ReviewsSection from "./ReviewsSection";
import TimelineSection from "./TimelineSection";

/** Секції, які головна отримує пропсами з page.tsx (server → client).
 *  Слоти дат статичні — інтеграція системи бронювання поза цим етапом. */
interface HomeProps {
  hero: SectionData<"hero">["hero"];
  timeline: SectionData<"timeline">["timeline"];
  cases: SectionData<"cases">["cases"];
  homeServiceOptions: readonly string[];
  promises: SectionData<"promises">["promises"];
  trust: SectionData<"promises">["trust"];
  /** Два найновіші опубліковані відгуки (етап 6). */
  reviews: ReviewItem[];
  book: SectionData<"book">["book"];
  contacts: SectionData<"contacts">["contacts"];
}

/** Головна, варіант Б (docs/home-rework-demo-b.html): унікальні секції
 *  замість дублювання сторінок. Стан (дата, формат) живе тут, бо секції
 *  «Підбір» і «Перевірка дати» розділені іншими, але обидві пишуть у форму
 *  бронювання внизу. Шапка й футер — з layout.tsx, без змін. */
export default function Home({
  hero,
  timeline,
  cases,
  homeServiceOptions,
  promises,
  trust,
  reviews,
  book,
  contacts,
}: HomeProps) {
  const [date, _setDate] = useState<string>("");
  const [service, setService] = useState<string>(
    cases[0]?.service ?? homeServiceOptions[0] ?? "",
  );
  const [programId, setProgramId] = useState<string | undefined>(undefined);

  return (
    <>
      <Hero hero={hero} contacts={contacts} />
      <TimelineSection timeline={timeline} />
      <CasePicker
        cases={cases}
        service={service}
        onPick={(svc, cid) => {
          setService(svc);
          setProgramId(cid);
        }}
      />
      <PromisesSection promises={promises} trust={trust} />
      <ReviewsSection reviews={reviews} />
      {/* <DateChecker date={date} onPick={setDate} /> */}
      <BookingSection
        date={date}
        service={service}
        programId={programId}
        options={homeServiceOptions}
        book={book}
        contacts={contacts}
        tint
      />
    </>
  );
}
