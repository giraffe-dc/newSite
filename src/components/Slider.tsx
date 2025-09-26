'use client'
import React, { useState, useEffect } from 'react'
import styles from '@/styles/Slider.module.css'

interface SliderProps {
  images: string[]
}

const Slider: React.FC<SliderProps> = ({ images }) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  // Default images if none provided
  const defaultImages = [
    'https://via.placeholder.com/1200x600/ff6b35/ffffff?text=Ігрова+Зона',
    'https://via.placeholder.com/1200x600/f7b731/ffffff?text=День+Народження',
    'https://via.placeholder.com/1200x600/5f27cd/ffffff?text=Кафе'
  ]
  
  const slideImages = images.length > 0 ? images : defaultImages

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideImages.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [slideImages.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slideImages.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slideImages.length) % slideImages.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <div className={styles.slider}>
      <div className={styles.slideContainer}>
        {slideImages.map((image, index) => (
          <div
            key={index}
            className={`${styles.slide} ${index === currentSlide ? styles.active : ''}`}
            style={{ backgroundImage: `url(${image})` }}
          />
        ))}
      </div>

      <button className={`${styles.navButton} ${styles.prevButton}`} onClick={prevSlide}>
        ❮
      </button>
      <button className={`${styles.navButton} ${styles.nextButton}`} onClick={nextSlide}>
        ❯
      </button>

      <div className={styles.indicators}>
        {slideImages.map((_, index) => (
          <button
            key={index}
            className={`${styles.indicator} ${index === currentSlide ? styles.indicatorActive : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>

      <div className={styles.sliderOverlay} />
    </div>
  )
}

export default Slider