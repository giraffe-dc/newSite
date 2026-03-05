"use client";
import React, { useState } from "react";
import styles from "../styles/PriceCard.module.css";

interface PriceCardProps {
  name: string;
  price: string;
  description: string;
  duration?: string;
  category: string;
  index: number;
  video: string | undefined;
}

const PriceCard: React.FC<PriceCardProps> = ({
  name,
  price,
  description,
  duration,
  category,
  index,
  video,
}) => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "games":
        return "🎮";
      case "birthday":
        return "🎂";
      case "family":
        return "👨‍👩‍👧‍👦";
      case "services":
        return "⭐";
      default:
        return "🎪";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "games":
        return "var(--primary-green)";
      case "birthday":
        return "var(--primary-orange)";
      case "family":
        return "var(--secondary-blue)";
      case "services":
        return "var(--primary-yellow)";
      default:
        return "var(--primary-orange)";
    }
  };

  // const isRevid = typeof video === 'string' && video.includes('revid.ai')
  const isGoogleDrive =
    typeof video === "string" &&
    (video.includes("drive.google.com") || video.includes("docs.google.com"));
  let drivePreview = "";
  let driveId = "";
  if (isGoogleDrive && typeof video === "string") {
    const m =
      video.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
      video.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m && m[1]) {
      drivePreview = `https://drive.google.com/file/d/${m[1]}/preview`;
      driveId = m[1];
    }
  }
  const [iframeFailed, setIframeFailed] = useState(false);
  const [driveVideoFailed, setDriveVideoFailed] = useState(false);
  const [useProxy, setUseProxy] = useState(false);

  // If embedding is blocked by the host, many browsers won't reliably fire
  // onError for cross-origin iframes. Use a short timeout as a heuristic to
  // detect failure and show a fallback (open in new tab).
  React.useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    if (isGoogleDrive && drivePreview && isVideoOpen) {
      setIframeFailed(false);
      setDriveVideoFailed(false);
      t = setTimeout(() => setIframeFailed(true), 1500);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [isGoogleDrive, drivePreview, isVideoOpen]);

  const isYouTube =
    typeof video === "string" &&
    (video.includes("youtube.com") || video.includes("youtu.be"));

  const renderVideoContent = (): React.ReactNode => {
    if (!video) return null;

    // removed revid.ai support: keep Google Drive, YouTube and direct video handling

    if (isGoogleDrive && drivePreview) {
      if (!iframeFailed) {
        return (
          <iframe
            className={styles.videoFrame}
            src={drivePreview}
            title={`Кліп - ${name}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIframeFailed(false)}
            onError={() => setIframeFailed(true)}
          />
        );
      }

      // If iframe embedding failed, try to play direct drive download in <video>
      if (!driveVideoFailed && driveId) {
        const proxied = `/api/video?id=${driveId}`;
        // if useProxy is set, immediately use proxied src to force the request
        return (
          <div style={{ textAlign: "center" }}>
            <video
              className={styles.videoFrame}
              controls
              src={useProxy ? proxied : proxied}
              onError={() => setDriveVideoFailed(true)}
              autoPlay
            />
            {/* <p style={{ color: '#fff', marginTop: 8 }}>
                            Якщо відтворення не починається, використайте кнопку
                            "Відкрити у новій вкладці".
                        </p> */}
            <div style={{ marginTop: 8 }}>
              <a href={video} target="_blank" rel="noopener noreferrer">
                <button className={styles.clipButton}>
                  Відкрити у новій вкладці
                </button>
              </a>
              <button
                className={styles.clipButton}
                style={{ marginLeft: 8 }}
                onClick={() => setIsVideoOpen(false)}
              >
                Закрити
              </button>
            </div>
          </div>
        );
      }

      // final fallback message when both iframe and direct video fail
      // return (
      //     <div
      //         style={{ padding: 20, color: '#fff', textAlign: 'center' }}
      //     >
      //         <p>
      //             Вбудовування Google Drive недоступне або браузер блокує
      //             відтворення.
      //         </p>
      //         <div style={{ marginTop: 12 }}>
      //             <a
      //                 href={video}
      //                 target="_blank"
      //                 rel="noopener noreferrer"
      //             >
      //                 <button className={styles.clipButton}>
      //                     Відкрити у новій вкладці
      //                 </button>
      //             </a>
      //             <button
      //                 className={styles.clipButton}
      //                 style={{ marginLeft: 8 }}
      //                 onClick={() => setIsVideoOpen(false)}
      //             >
      //                 Закрити
      //             </button>
      //         </div>
      //     </div>
      // )
    }

    if (isYouTube) {
      return (
        <iframe
          className={styles.videoFrame}
          src={video}
          title={`Кліп - ${name}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    // default: direct video file
    return <video className={styles.videoFrame} controls src={video} />;
  };

  // Video modal (conditional)
  return (
    <>
      <div
        className={`${styles.priceCard} card fade-in`}
        style={
          {
            animationDelay: `${index * 0.1}s`,
            "--category-color": getCategoryColor(category),
          } as React.CSSProperties
        }
      >
        <div className={styles.cardHeader}>
          <div className={styles.categoryBadge}>
            <span className={styles.categoryIcon}>
              {getCategoryIcon(category)}
            </span>
          </div>
          <div className={styles.priceTag}>
            <span className={styles.currency}>₴</span>
            <span className={styles.amount}>{price}</span>
            {video && video.trim() !== "" && (
              <button
                className={styles.clipButton}
                onClick={() => {
                  // open modal and for Google Drive prefer proxy playback
                  if (isGoogleDrive && driveId) setUseProxy(true);
                  setIsVideoOpen(true);
                }}
                aria-label={`Відкрити кліп для ${name}`}
              >
                Відео
              </button>
            )}
          </div>
        </div>

        <div className={styles.cardContent}>
          <h3 className={styles.serviceName}>{name}</h3>
          <p className={styles.description}>{description}</p>
          {duration && (
            <div className={styles.duration}>
              <span className={styles.durationIcon}>⏱️</span>
              <span>{duration}</span>
            </div>
          )}
        </div>
      </div>

      {isVideoOpen && video && (
        <div
          className={styles.videoModalOverlay}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.videoModal}>
            <button
              className={styles.videoClose}
              onClick={() => setIsVideoOpen(false)}
              aria-label="Закрити відео"
            >
              ✕
            </button>
            {renderVideoContent()}
          </div>
        </div>
      )}
    </>
  );
};

export default PriceCard;
