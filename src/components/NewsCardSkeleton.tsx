"use client";
import React from "react";
import styles from "@/styles/NewsCard.module.css";
import { Skeleton } from "./ui/Skeleton";

const NewsCardSkeleton = () => {
  return (
    <div className={styles.newsCard} style={{ opacity: 0.7 }}>
      <Skeleton height="200px" borderRadius="16px 16px 0 0" />
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <Skeleton width="100px" height="24px" />
          <Skeleton width="80px" height="24px" />
        </div>
        <Skeleton width="80%" height="28px" className="mb-2" />
        <Skeleton width="100%" height="16px" />
        <Skeleton width="90%" height="16px" />
        <div className={styles.cardFooter}>
          <Skeleton width="120px" height="32px" />
          <Skeleton width="100px" height="40px" />
        </div>
      </div>
    </div>
  );
};

export default NewsCardSkeleton;
