'use client'
import React from 'react'
import { Button } from './ui/button'
import { Star, MapPin, Clock } from 'lucide-react'
import styles from '../styles/Hero.module.css'
import heroImage from '@/assets/hero-image.jpg'
import giraffeMascot from '@/assets/giraffe-logo.png'
import Link from 'next/link'
import Image from 'next/image'

interface FeatureCard {
    title: string
    description: string
}

interface HomeData {
    title: string
    description: string
    featureCards: FeatureCard[]
    workingHours: string
    address: string
}

const Hero: React.FC<{ homeData: HomeData }> = ({ homeData }) => {
    return (
        <section className={styles.hero}>
            <Image
                alt="Background"
                src={heroImage}
                placeholder="blur"
                quality={80}
                fill
                sizes="100vw"
                style={{
                    objectFit: 'cover',
                    zIndex: -1,
                }}
            />
            <div className={`${styles.decorCircle} ${styles.decorCircle1}`} />
            <div className={`${styles.decorCircle} ${styles.decorCircle2}`} />
            <div className={`${styles.decorCircle} ${styles.decorCircle3}`} />

            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.mascotWrapper}>
                        <Image
                            src={giraffeMascot}
                            alt="Жирафик талісман"
                            // width={150}
                            height={150}
                            className={styles.mascotImage}
                        />
                    </div>

                    <p className={styles.subtitle}>
                        {homeData?.description || 'Помилка завантаження опису.'}
                    </p>

                    <div className={styles.features}>
                        <div className={styles.featureItem}>
                            <Star className={styles.featureIcon} />
                            <span className={styles.featureText}>
                                Рейтинг 4.9/5
                            </span>
                        </div>
                        <div className={styles.featureItem}>
                            <MapPin className={styles.featureIcon} />
                            <span className={styles.featureText}>
                                Центр міста
                            </span>
                        </div>
                        <div className={styles.featureItem}>
                            <Clock className={styles.featureIcon} />
                            <span className={styles.featureText}>
                                {homeData?.workingHours || '10:00 - 20:00'}
                            </span>
                        </div>
                    </div>

                    <div className={styles.buttons}>
                        <Button
                            variant="hero"
                            size="xl"
                            className={styles.button}
                        >
                            Забронювати зараз
                        </Button>
                        <Link href="/prices">
                            <Button
                                variant="playful"
                                size="xl"
                                className={styles.button}
                            >
                                Дивитися ціни
                            </Button>
                        </Link>
                    </div>

                    <div className={styles.featureCards}>
                        {homeData?.featureCards
                            .slice(0, 3)
                            .map((feature, index) => (
                                <div key={index} className={styles.featureCard}>
                                    <h3 className={styles.featureCardTitle}>
                                        {feature.title}
                                    </h3>
                                    <p
                                        className={
                                            styles.featureCardDescription
                                        }
                                    >
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Hero