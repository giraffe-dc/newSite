'use client'
import React, { useState } from 'react'
import Hero from "@/components/Hero";
import dynamic from 'next/dynamic'

const PhotoSlider = dynamic(() => import('../components/PhotoSlider'), {
    loading: () => <p>Завантаження фото...</p>,
    ssr: false,
})
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "../components/ui/Card";
import { Shield, Gamepad2, PartyPopper, Coffee, Users, Star } from "lucide-react";
import styles from "@/styles/Home.module.css";
import globalStyles from "@/styles/GlobalStyles.module.css";
import Link from 'next/link';
import BookingModal from './BookingModal'

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}

interface HomeData {
  features: string[];
  images: string[];
  title: string;
  description: string;
  workingHours: string;  
  address: string;
  featureCards: {
    title: string;
    description: string;
  }[];
  phone: string;
}

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Безпека: Shield,
  Розваги: Gamepad2,
  Свята: PartyPopper,
  Кафе: Coffee,
  Сімейна: Users,
  Рейтинги: Star,
};

const colorMap: { [key: string]: string } = {
  Безпека: styles.colorPrimary,
  Розваги: styles.colorAccent,
  Свята: styles.colorPink,
  Кафе: styles.colorBlue,
  Сімейна: styles.colorSecondary,
  Рейтинги: styles.colorPrimary,
};

const HomePageClient: React.FC<{ homeData: HomeData }> = ({ homeData }) => {
  const [open, setOpen] = useState(false)

  const features = homeData.features.map((featureString: string) => {
    const [title, description] = featureString.split(':');
    const key = Object.keys(iconMap).find(k => title.includes(k));
    return {
      icon: key ? iconMap[key] : Star, // Іконка за замовчуванням
      title,
      description,
      color: key ? colorMap[key] : styles.colorPrimary,
    };
  });

  return (
      <div className={`${styles.container} ${globalStyles.body}`}>
          <Hero homeData={homeData} />
          <PhotoSlider photos={homeData.images || []} />

          <section className={styles.aboutSection}>
              <div className={styles.containerInner}>
                  <div className={styles.textCenter}>
                      <h2 className={styles.sectionTitle}>
                          Чому обирають Жирафик?
                      </h2>
                      <p className={styles.sectionDescription}>
                          Ми створили унікальне місце, де кожна дитина та батьки
                          можуть відчути справжню радість
                      </p>
                  </div>

                  <div className={styles.featuresGrid}>
                      {features.map((feature, index) => (
                          <Card
                              key={index}
                              className={`${styles.card} ${styles.cardAnimation}`}
                              style={{ animationDelay: `${index * 100}ms` }}
                          >
                              <CardContent className={styles.cardContent}>
                                  <div
                                      className={`${styles.iconWrapper} ${feature.color}`}
                                  >
                                      <feature.icon className={styles.icon} />
                                  </div>
                                  <h3 className={styles.cardTitle}>
                                      {feature.title}
                                  </h3>
                                  <p className={styles.cardDescription}>
                                      {feature.description}
                                  </p>
                              </CardContent>
                          </Card>
                      ))}
                  </div>
              </div>
          </section>

          <section className={styles.ctaSection}>
              <div className={styles.ctaOverlay} />
              <div className={`${styles.containerInner} ${styles.ctaContent}`}>
                  <h2 className={styles.ctaTitle}>
                      Готові до незабутніх вражень?
                  </h2>
                  <p className={styles.ctaDescription}>
                      Забронюйте свій візит вже зараз і отримайте знижку 10% на
                      перше відвідування
                  </p>
                  <div className={styles.ctaButtons}>
                      <Button
                          variant="hero"
                          size="xl"
                          className={styles.primaryButton}
                          onClick={() => setOpen(true)}
                      >
                          Забронювати зараз
                      </Button>
                      <Link href="/prices">
                          <Button
                              variant="playful"
                              size="xl"
                              className={styles.outlineButton}
                          >
                              Подивитися ціни
                          </Button>
                      </Link>
                  </div>
                  <BookingModal open={open} onClose={() => setOpen(false)} />
              </div>
          </section>
      </div>
  )
};

export default HomePageClient;
