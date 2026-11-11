import BookingForm from "./BookingForm";
import { BOOK, CONTACTS } from "./content";
import { longDateLabel } from "./dates";

export default function BookingSection({
  date,
  service,
  options,
  tint = false,
}: {
  date?: string;
  service?: string;
  options?: readonly string[];
  tint?: boolean;
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
            <h2 id="book-title">{BOOK.title}</h2>
            {date && (
              <div className="m2-slot">
                Обрана дата: <b>{longDateLabel(date)}</b> · відповідаємо за
                годину
              </div>
            )}
            <p className="m2-book__side">{BOOK.side}</p>
            <div className="m2-contacts">
              <div>
                <b>Телефон:</b>{" "}
                <a href={`tel:${CONTACTS.tel}`}>{CONTACTS.phone}</a>
              </div>
              <div>
                <b>Пошта:</b>{" "}
                <a href={`mailto:${CONTACTS.email}`}>{CONTACTS.email}</a>
              </div>
              <div>
                <b>Години:</b> {CONTACTS.hours}
              </div>
            </div>
          </div>
          <BookingForm date={date} service={service} options={options} />
        </div>
      </div>
    </section>
  );
}
