import { PROMISES, TRUST } from "./content";

/** Три гарантії + цифри довіри — унікальний блок головної. */
export default function PromisesSection() {
  return (
    <section className="m2-sec" id="promises" aria-labelledby="promises-title">
      <div className="m2-wrap">
        <div className="m2-sec__head">
          <span className="m2-eyebrow">Чому це безпечно</span>
          <h2 id="promises-title">Три речі, за які ми відповідаємо</h2>
          <p>
            Це не обіцянки «магії», а умови, які прописані в нашому процесі.
          </p>
        </div>
        <div className="m2-promises">
          {PROMISES.map((promise) => (
            <article className="m2-promise" key={promise.title}>
              <div className="m2-promise__ico" aria-hidden="true">
                {promise.ico}
              </div>
              <h3>{promise.title}</h3>
              <p>{promise.text}</p>
            </article>
          ))}
        </div>
        <div className="m2-trust">
          {TRUST.map((item) => (
            <span key={item.label}>
              <b>{item.value}</b> {item.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
