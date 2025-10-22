"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "@/styles/PhotoSlider.module.css";
import heroImage from "@/assets/hero-image.jpg";
import playground1 from "@/assets/playground1.jpg";
import birthdayParty from "@/assets/birthday-party.jpg";
import cafeArea from "@/assets/cafe-area.jpg";

interface Photo {
  // id: number;
  // url: string;
  // alt: string;
  // caption: string;
}

// const photos: Photo[] = [
//   {
//     id: 1,
//     url: heroImage.src,
//     alt: "Основна ігрова зона",
//     caption: "Яскрава та безпечна ігрова зона для всіх віків",
//   },
//   {
//     id: 2,
//     url: playground1.src,
//     alt: "Дитячий майданчик",
//     caption: "Захопливі гірки та лабіринти для маленьких дослідників",
//   },
//   {
//     id: 3,
//     url: cafeArea.src,
//     alt: "Кафе зона",
//     caption: "Затишне кафе для відпочинку батьків",
//   },
//   {
//     id: 4,
//     url: birthdayParty.src,
//     alt: "День народження",
//     caption: "Незабутні святкування днів народжень",
//   },
// ];

const PhotoSlider: React.FC<{ photos: string[] }> = ({ photos }) => {
    const [currentIndex, setCurrentIndex] = useState<number>(0)
    const [isAutoplay, setIsAutoplay] = useState<boolean>(true)

    // Fallback photos when none provided from server
    const defaultPhotos = [
        heroImage.src,
        playground1.src,
        birthdayParty.src,
        cafeArea.src,
    ]

    const slidePhotos =
        Array.isArray(photos) && photos.length > 0 ? photos : defaultPhotos

    useEffect(() => {
        if (!isAutoplay || slidePhotos.length === 0) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slidePhotos.length)
        }, 4000)

        return () => clearInterval(interval)
    }, [isAutoplay, slidePhotos.length])

    const scheduleResume = () => {
        setIsAutoplay(false)
        // resume after a short pause
        const t = setTimeout(() => setIsAutoplay(true), 5000)
        return () => clearTimeout(t)
    }

    const goToSlide = (index: number): void => {
        if (slidePhotos.length === 0) return
        setCurrentIndex(index)
        scheduleResume()
    }

    const goToPrevious = (): void => {
        if (slidePhotos.length === 0) return
        setCurrentIndex(
            (prev) => (prev - 1 + slidePhotos.length) % slidePhotos.length
        )
        scheduleResume()
    }

    const goToNext = (): void => {
        if (slidePhotos.length === 0) return
        setCurrentIndex((prev) => (prev + 1) % slidePhotos.length)
        scheduleResume()
    }

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Наші розваги</h2>
                    <p className={styles.description}>
                        Подивіться на наші неймовірні ігрові зони та атмосферу
                        веселощів
                    </p>
                </div>

                <div className={styles.sliderWrapper}>
                    {/* Основний слайдер */}
                    <div className={styles.slider}>
                        <div
                            className={styles.slides}
                            style={{
                                transform: `translateX(-${
                                    currentIndex * 100
                                }%)`,
                            }}
                        >
                            {slidePhotos.map((photo, index) => (
                                <div key={index} className={styles.slide}>
                                    <img
                                        src={photo}
                                        alt={`slide-${index}`}
                                        className={styles.slideImage}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Стрілки навігації */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToPrevious}
                            className={styles.navButtonLeft}
                        >
                            <ChevronLeft className={styles.navIcon} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToNext}
                            className={styles.navButtonRight}
                        >
                            <ChevronRight className={styles.navIcon} />
                        </Button>
                    </div>

                    {/* Індикатори */}
                    <div className={styles.indicators}>
                        {slidePhotos.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                aria-label={`Go to slide ${index + 1}`}
                                className={`${styles.indicator} ${
                                    index === currentIndex
                                        ? styles.indicatorActive
                                        : ''
                                }`}
                            />
                        ))}
                    </div>

                    {/* Мініатюри для десктопа */}
                    <div className={styles.thumbnails}>
                        {slidePhotos.map((photo, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`${styles.thumbnail} ${
                                    index === currentIndex
                                        ? styles.thumbnailActive
                                        : ''
                                }`}
                            >
                                <img
                                    src={photo}
                                    alt={`thumbnail-${index}`}
                                    className={styles.thumbnailImage}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
};

export default PhotoSlider;