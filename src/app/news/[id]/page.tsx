import React from "react";
import { Metadata, ResolvingMetadata } from "next";
import { NewsService } from "@/lib/services/NewsService";
import { notFound } from "next/navigation";
import NewsPageClient from "@/components/NewsPageClient";

interface Props {
  params: { id: string };
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { id } = await params;
  const news = await NewsService.getById(id);

  if (!news) {
    return {
      title: "Новина не знайдена | Жирафик",
    };
  }

  return {
    title: `${news.title} | Жирафик`,
    description: news.content.substring(0, 160),
    openGraph: {
      images: news.images && news.images.length > 0 ? [news.images[0]] : [],
    },
  };
}

export default async function NewsItemPage({ params }: Props) {
  const { id } = await params;
  const news = await NewsService.getById(id);

  if (!news) {
    notFound();
  }

  // Convert Mongoose doc to plain object for Client Component
  const plainNews = JSON.parse(JSON.stringify(news));

  return <NewsPageClient news={plainNews} id={id} />;
}
