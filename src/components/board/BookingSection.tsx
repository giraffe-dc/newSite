import type { SectionData } from "@/lib/siteContent";
import BookingForm from "./BookingForm";
import { BOOK, CONTACTS } from "./content";

export default function BookingSection({
  date,
  service,
  options,
  tint = false,
  book = BOOK,
  contacts = CONTACTS,
}: {
  date?: string;
  service?: string;
  options?: readonly string[];
  tint?: boolean;
  book?: SectionData<"book">["book"];
  contacts?: SectionData<"contacts">["contacts"];
}) {
  return (
    <section
      className={tint ? "m2-sec m2-sec--tint" : "m2-sec"}
      id="book"
      aria-labelledby="book-title"
    >
      <div className="m2-wrap">
        <div className="m2-book">
          <div>
            <h2 id="book-title">{book.title}</h2>
            {/* {date && (
              <div className="m2-slot">
                Обрана дата: <b>{longDateLabel(date)}</b> · відповідаємо за
                годину
              </div>
            )} */}
            <p className="m2-book__side">{book.side}</p>
            <div className="m2-contacts">
              <div>
                <b>Телефон:</b>{" "}
                <a href={`tel:${contacts.tel}`}>{contacts.phone}</a>
              </div>
              <div>
                <b>Пошта:</b>{" "}
                <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
              </div>
              <div>
                <b>Години:</b> {contacts.hours}
              </div>
            </div>
          </div>
          <BookingForm
            date={date}
            service={service}
            options={options}
            book={book}
          />
        </div>
      </div>
    </section>
  );
}
