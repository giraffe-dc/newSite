"use client";

import React from "react";
import styles from "@/styles/ui/Skeleton.module.css";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  circle?: boolean;
}

export const Skeleton = ({
  width,
  height,
  borderRadius,
  className = "",
  circle = false,
}: SkeletonProps) => {
  const style: React.CSSProperties = {
    width: width,
    height: height,
    borderRadius: circle ? "50%" : borderRadius || "8px",
  };

  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};
