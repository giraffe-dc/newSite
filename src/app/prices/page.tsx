"use client";
import React, { useState, useEffect } from "react";
import PriceCard from "@/components/PriceCard";
import styles from "@/styles/Prices.module.css";
import { Button } from "@/components/ui/button";
import BookingModal from "@/components/BookingModal";

interface PriceItem {
  _id?: string;
  name: string;
  price: string;
  description: string;
  duration?: string;
  category: string;
  video?: string | undefined;
}

interface CategoryItem {
  _id?: string;
  key: string;
  label: string;
  icon: string;
}

const PricesPage = () => {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [open, setOpen] = useState(false);
  const [offers, setOffers] = useState<
    { _id?: string; title: string; description: string }[]
  >([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pricesRes, categoriesRes, offersRes] = await Promise.all([
        fetch("/api/data/prices"),
        fetch("/api/data/price-categories"),
        fetch("/api/data/offers"),
      ]);

      if (pricesRes.ok) {
        const pricesData = await pricesRes.json();
        setPrices(pricesData);
      }
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories([
          { key: "all", label: "Всі послуги", icon: "🎪" },
          ...categoriesData,
        ]);
      }
      if (offersRes.ok) {
        const offersData = await offersRes.json();
        setOffers(offersData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrices =
    selectedCategory === "all"
      ? prices
      : prices.filter((price) => price.category === selectedCategory);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>💰</div>
        <p>Завантаження цін...</p>
      </div>
    );
  }

  return (
    <div className={styles.pricesPage}>
      <div className="container">
        {/* Header */}
        <section className={styles.header}>
          <h1 className={styles.title}>Наші ціни</h1>
          <p className={styles.subtitle}>
            Доступні ціни на всі розваги для вашої родини
          </p>
          <div className={styles.headerDecoration}>
            <span className={styles.decorIcon}>💰</span>
            <span className={styles.decorIcon}>🎈</span>
            <span className={styles.decorIcon}>🎪</span>
          </div>
        </section>

        {/* Category Filter */}
        <section className={styles.filterSection}>
          <div className={styles.categoryFilter}>
            {categories.map((category) => (
              <button
                key={category.key}
                className={`${styles.categoryButton} ${
                  selectedCategory === category.key ? styles.active : ""
                }`}
                onClick={() => setSelectedCategory(category.key)}
              >
                <span className={styles.categoryIcon}>{category.icon}</span>
                <span className={styles.categoryLabel}>{category.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Prices Grid */}
        <section className={styles.pricesSection}>
          <div className={styles.pricesGrid}>
            {filteredPrices.map((price, index) => (
              <PriceCard
                key={price._id || index}
                name={price.name}
                price={price.price}
                description={price.description}
                duration={price.duration}
                category={price.category}
                index={index}
                video={price.video}
              />
            ))}
          </div>
        </section>

        {/* CTA Section */}
        {/* <section className={styles.ctaSection}>
          <div className={styles.ctaCard}>
            <h2 className={styles.ctaTitle}>Готові забронювати?</h2>
            <p className={styles.ctaText}>
              Зателефонуйте нам або завітайте особисто для бронювання свята
            </p>
            <div className={styles.ctaButtons}>
              <a href="tel:+380931234567" className="btn-primary">
                📞 Зателефонувати
              </a>
              <a href="/news-contacts" className="btn-secondary">
                📍 Контакти
              </a>
            </div>
          </div>
        </section> */}
      </div>

      {/* Акції та знижки */}
      <section className={styles.offersSection}>
        <div className={styles.containerInner}>
          <div className={styles.offersWrapper}>
            <h2 className={styles.offersTitle}>Спеціальні пропозиції</h2>
            <div className={styles.offersGrid}>
              {offers.map((o: any) => (
                <div
                  key={o._id || o.title}
                  className={styles.offerItem}
                  data-recommended={o.recommended ? "true" : "false"}
                >
                  <div className={styles.offerHeader}>
                    <h3 className={styles.offerTitle}>
                      {(o.icon || "🏷️") + " " + o.title}
                    </h3>
                    {o.recommended && (
                      <span className={styles.offerBadge}>
                        ⭐ Рекомендовано
                      </span>
                    )}
                  </div>
                  <p className={styles.offerDescription}>{o.description}</p>
                </div>
              ))}
            </div>
            <Button
              variant="hero"
              size="xl"
              className={styles.discountButton}
              onClick={() => setOpen(true)}
            >
              Забронювати зі знижкою
            </Button>
          </div>
        </div>
      </section>
      <BookingModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default PricesPage;
