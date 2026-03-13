"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "@/styles/NewsSlider.module.css";
import { extractGoogleDriveFileId, getGoogleDriveImageUrl } from "@/lib/googleDrive";

interface NewsSliderProps {
  images: string[];
}

const NewsSlider: React.FC<NewsSliderProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  if (!images || images.length === 0) return null;

  const processedImages = images.map((img) => {
    const driveId = extractGoogleDriveFileId(img);
    return driveId ? getGoogleDriveImageUrl(driveId) : img;
  });

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => (prevIndex + newDirection + processedImages.length) % processedImages.length);
  };

  return (
    <div className={styles.sliderContainer}>
      <div className={styles.mainWrapper}>
        <AnimatePresence initial={false} custom={direction}>
          <motion.img
            key={currentIndex}
            src={processedImages[currentIndex]}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className={styles.slideImage}
            alt="News slide"
          />
        </AnimatePresence>

        {processedImages.length > 1 && (
          <>
            <button className={styles.navButtonPrev} onClick={() => paginate(-1)}>
              <ChevronLeft size={24} />
            </button>
            <button className={styles.navButtonNext} onClick={() => paginate(1)}>
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {processedImages.length > 1 && (
        <div className={styles.thumbnailList}>
          {processedImages.map((img, index) => (
            <button
              key={index}
              className={`${styles.thumbnailItem} ${index === currentIndex ? styles.thumbnailActive : ""}`}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
              }}
            >
              <img src={img} alt={`Thumbnail ${index}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsSlider;
