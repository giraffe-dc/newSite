"use client";
import React, { useState, useEffect } from "react";
import styles from "@/styles/NewsCard.module.css";
import NewsModal from "./NewsModal";
import {
  extractGoogleDriveFileId,
  getGoogleDriveImageUrl,
} from "@/lib/googleDrive";

import Link from "next/link";
import { Survey } from "@/types";

interface NewsCardProps {
  title: string;
  content: string;
  date: string;
  type: "news" | "event";
  images: string[];
  index: number;
  survey?: Survey;
  id?: string;
}

import { FadeIn } from "./ui/FadeIn";


const NewsCard: React.FC<NewsCardProps> = ({
  title,
  content,
  date,
  type,
  images,
  index,
  survey,
  id,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processedImages, setProcessedImages] = useState<string[]>([]);

  useEffect(() => {
    const processed = (images || []).map((url) => {
      const id = extractGoogleDriveFileId(url);
      return id ? getGoogleDriveImageUrl(id) : url;
    });
    setProcessedImages(processed);
  }, [images]);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("uk-UA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTypeIcon = (type: string) => {
    return type === "event" ? "🎉" : "📰";
  };

  const getTypeColor = (type: string) => {
    return type === "event" ? "var(--primary-orange)" : "var(--secondary-blue)";
  };

  const getTypeLabel = (type: string) => {
    return type === "event" ? "Подія" : "Новина";
  };

  return (
    <FadeIn delay={index * 0.1} direction="up">
      <article
        className={styles.newsCard}
        style={
          {
            "--type-color": getTypeColor(type),
          } as React.CSSProperties
        }
      >
        {processedImages.length > 0 && (
          <div className={styles.imageContainer}>
            <img
              src={processedImages[0]}
              alt={title}
              className={styles.newsImage}
            />
            <div className={styles.imageOverlay}>
              <span className={styles.typeIcon}>{getTypeIcon(type)}</span>
            </div>
          </div>
        )}

        <div className={styles.cardContent}>
          <div className={styles.cardHeader}>
            <div className={styles.typeBadge}>
              <span className={styles.badgeIcon}>{getTypeIcon(type)}</span>
              <span className={styles.badgeText}>{getTypeLabel(type)}</span>
            </div>
            <div className={styles.dateInfo}>
              <span className={styles.dateIcon}>📅</span>
              <span className={styles.dateText}>{formatDate(date)}</span>
            </div>
          </div>

          <h3 className={styles.newsTitle}>{title}</h3>

          <p className={styles.newsContent}>{content}</p>

          {survey && (
            <div className={styles.surveyPreview}>
              <div className={styles.surveyPreviewQuestion}>
                {survey.question}
              </div>
              <div className={styles.surveyPreviewMeta}>
                {survey.endDate && (
                  <span>⏳ до {formatDate(survey.endDate)}</span>
                )}
              </div>
            </div>
          )}

          <div className={styles.cardFooter}>
            <div className={styles.footerMeta}>
              {survey && (
                <span className={styles.surveyBadge}>
                  <span className={styles.surveyIcon}>📊</span>
                  Опитування
                </span>
              )}
              {images && images.length > 0 && (
                <span className={styles.photoBadge}>
                  <span className={styles.photoIcon}>📷</span>
                  {images.length} фото
                </span>
              )}
            </div>
            <Link
              href={`/news/${id}`}
              className={styles.readMoreButton}
            >
              Читати далі
              <span className={styles.buttonIcon}>→</span>
            </Link>
          </div>
        </div>
      </article>
      <NewsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
        content={content}
        date={date}
        type={type}
        images={processedImages}
        survey={survey}
        newsId={id}
      />
    </FadeIn>
  );
};

export default NewsCard;
