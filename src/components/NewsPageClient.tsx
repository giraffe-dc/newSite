"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import styles from "@/styles/NewsPage.module.css";
import NewsSlider from "@/components/NewsSlider";
import { SurveyVote } from "@/components/SurveyVote";
import SurveyFreeForm from "@/components/SurveyFreeForm";

interface NewsPageClientProps {
  news: any;
  id: string;
}

const NewsPageClient: React.FC<NewsPageClientProps> = ({ news, id }) => {
  const [showResults, setShowResults] = React.useState(false);
  const [results, setResults] = React.useState<Record<string, number> | undefined>(
    news.survey?.results?.optionResults
  );
  const [totalVotes, setTotalVotes] = React.useState<number | undefined>(
    news.survey?.results?.totalVotes
  );

  const handleVote = async (optionIds: string[]) => {
    try {
      const res = await fetch("/api/survey/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsId: id, optionIds }),
      });

      if (res.ok) {
        // Fetch fresh results
        const r = await fetch(`/api/survey/results?newsId=${encodeURIComponent(id)}`);
        if (r.ok) {
          const data = await r.json();
          setResults(data.optionResults || {});
          setTotalVotes(data.totalVotes || 0);
          setShowResults(true);
        }
      }
    } catch (err) {
      console.error("Error voting:", err);
    }
  };

  return (
    <div className={styles.newsPage}>
      <div className="container">
        <Link href="/news-contacts" className={styles.backLink}>
          <ArrowLeft size={20} />
          Назад до новин
        </Link>

        <article className={styles.article}>
          <header className={styles.header}>
            <div className={styles.meta}>
              <span className={styles.date}>
                <Calendar size={16} />
                {new Date(news.date).toLocaleDateString("uk-UA", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className={styles.category}>
                <Tag size={16} />
                {news.type === "event" ? "Подія" : "Новина"}
              </span>
            </div>
            <h1 className={styles.title}>{news.title}</h1>
          </header>

          {/* Image Slider */}
          {news.images && news.images.length > 0 && (
            <NewsSlider images={news.images} />
          )}

          <div className={styles.content}>
            {news.content.split("\n").map((para: string, i: number) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Survey Section */}
          {news.survey && (
            <div className={styles.surveySection}>
              {news.survey.fields && news.survey.fields.length > 0 ? (
                <SurveyFreeForm survey={news.survey} newsId={id} />
              ) : (
                <SurveyVote
                  survey={news.survey}
                  showResults={showResults}
                  results={results}
                  totalVotes={totalVotes}
                  onVote={handleVote}
                />
              )}
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

export default NewsPageClient;
