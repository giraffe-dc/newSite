'use client'
import React, { useState, useEffect } from 'react'
import { Button } from "./ui/button";
import { Star, MapPin, Clock } from "lucide-react";
import styles from "../styles/Hero.module.css";
import heroImage from "@/assets/hero-image.jpg";
import giraffeMascot from "@/assets/giraffe-logo.png";
import Link from 'next/link';

interface FeatureCard {
  title: string;
  description: string;
}

interface HomeData {
  title: string;
  description: string;
  featureCards: FeatureCard[];
  workingHours: string;
  address: string; // Додамо адресу для "Центр міста"
}

const Hero: React.FC = () => {
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await fetch('/api/data/home');
        // const responseF = await fetch('/api/data/home')
        if (response.ok) {
          const data = await response.json();
          setHomeData(data);
        }
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <section className={styles.hero}>
      <div
        className={styles.backgroundImage}
        style={{ backgroundImage: `url(${heroImage.src})` }}
      />
      <div className={`${styles.decorCircle} ${styles.decorCircle1}`} />
      <div className={`${styles.decorCircle} ${styles.decorCircle2}`} />
      <div className={`${styles.decorCircle} ${styles.decorCircle3}`} />

      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.mascotWrapper}>
            <img
              src={giraffeMascot.src}
              alt="Жирафик талісман"
              className={styles.mascotImage}
            />
          </div>

          {loading ? (
            <p className={`${styles.subtitle} ${styles.skeleton}`}>Завантаження опису...</p>
          ) : (
            <p className={styles.subtitle}>
              {homeData?.description || 'Помилка завантаження опису.'}
            </p>
          )}

          <div className={styles.features}>
            <div className={styles.featureItem}>
              <Star className={styles.featureIcon} />
              <span className={styles.featureText}>Рейтинг 4.9/5</span>
            </div>
            <div className={styles.featureItem}>
              <MapPin className={styles.featureIcon} />
              {loading ? (
                <span className={`${styles.featureText} ${styles.skeleton}`}>...</span>
              ) : (
                <span className={styles.featureText}>Центр міста</span>
              )}
            </div>
            <div className={styles.featureItem}>
              <Clock className={styles.featureIcon} />
              {loading ? (
                <span className={`${styles.featureText} ${styles.skeleton}`}>...</span>
              ) : (
                <span className={styles.featureText}>{homeData?.workingHours || '10:00 - 20:00'}</span>
              )}
            </div>
          </div>

          <div className={styles.buttons}>
            <Button variant="hero" size="xl" className={styles.button}>
              Забронювати зараз
            </Button>
            <Link href="/prices">
              <Button variant="playful" size="xl" className={styles.button}>
                Дивитися ціни
              </Button>
            </Link>
          </div>

          <div className={styles.featureCards}>
            {loading ? (
              [...Array(3)].map((_, index) => (
                <div key={index} className={`${styles.featureCard} ${styles.skeleton}`}>
                  <h3 className={styles.featureCardTitle}>&nbsp;</h3>
                  <p className={styles.featureCardDescription}>&nbsp;</p>
                </div>
              ))
            ) : (
              homeData?.featureCards.slice(0, 3).map((feature, index) => (
                <div key={index} className={styles.featureCard}>
                  <h3 className={styles.featureCardTitle}>{feature.title}</h3>
                  <p className={styles.featureCardDescription}>{feature.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
