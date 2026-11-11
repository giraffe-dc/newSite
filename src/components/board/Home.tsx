"use client";

import { useState } from "react";
import BookingSection from "./BookingSection";
import CasePicker from "./CasePicker";
import { CASES, DATE_SLOTS, HOME_SERVICE_OPTIONS } from "./content";
import DateChecker from "./DateChecker";
import Hero from "./Hero";
import PromisesSection from "./PromisesSection";
import ReviewsSection from "./ReviewsSection";
import TimelineSection from "./TimelineSection";

/** Головна, варіант Б (docs/home-rework-demo-b.html): унікальні секції
 *  замість дублювання сторінок. Стан (дата, формат) живе тут, бо секції
 *  «Підбір» і «Перевірка дати» розділені іншими, але обидві пишуть у форму
 *  бронювання внизу. Шапка й футер — з layout.tsx, без змін. */
export default function Home() {
  const [date, setDate] = useState<string>(DATE_SLOTS[1].iso);
  const [service, setService] = useState<string>(CASES[0].service);

  return (
    <>
      <Hero />
      <TimelineSection />
      <CasePicker service={service} onPick={setService} />
      <PromisesSection />
      <ReviewsSection />
      <DateChecker date={date} onPick={setDate} />
      <BookingSection
        date={date}
        service={service}
        options={HOME_SERVICE_OPTIONS}
        tint
      />
    </>
  );
}
