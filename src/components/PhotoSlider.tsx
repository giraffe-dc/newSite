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
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAutoplay, setIsAutoplay] = useState<boolean>(true);

  useEffect(() => {
    if (!isAutoplay) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoplay]);

  const goToSlide = (index: number): void => {
    setCurrentIndex(index);
    setIsAutoplay(false);
    setTimeout(() => setIsAutoplay(true), 5000);
  };

  const goToPrevious = (): void => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setIsAutoplay(false);
    setTimeout(() => setIsAutoplay(true), 5000);
  };

  const goToNext = (): void => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    setIsAutoplay(false);
    setTimeout(() => setIsAutoplay(true), 5000);
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Наші розваги</h2>
          <p className={styles.description}>
            Подивіться на наші неймовірні ігрові зони та атмосферу веселощів
          </p>
        </div>

        <div className={styles.sliderWrapper}>
          {/* Основний слайдер */}
          <div className={styles.slider}>
            <div
              className={styles.slides}
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {photos.map((photo,index) => (
                <div key={index} className={styles.slide}>
                  <img
                    src={photo}
                    // alt={photo.alt}
                    className={styles.slideImage}
                  />
                  {/* <div className={styles.slideCaption}>
                    <h3 className={styles.captionText}>{photo.caption}</h3>
                  </div> */}
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
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`${styles.indicator} ${
                  index === currentIndex ? styles.indicatorActive : ""
                }`}
              />
            ))}
          </div>

          {/* Мініатюри для десктопа */}
          <div className={styles.thumbnails}>
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`${styles.thumbnail} ${
                  index === currentIndex ? styles.thumbnailActive : ""
                }`}
              >
                <img
                  src={photo}
                  // alt={photo.alt}
                  className={styles.thumbnailImage}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhotoSlider;