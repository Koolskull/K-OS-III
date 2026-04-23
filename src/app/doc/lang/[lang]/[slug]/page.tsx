import { ARTICLES, LANGUAGES } from "@/lib/doc/articles";
import LangArticleClient from "./LangArticleClient";

/** Pre-render every (non-English language) × (article slug) combo. */
export function generateStaticParams() {
  const params: { lang: string; slug: string }[] = [];
  for (const lang of LANGUAGES) {
    if (lang === "en") continue;
    for (const article of ARTICLES) {
      params.push({ lang, slug: article.slug });
    }
  }
  return params;
}

interface PageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export default async function LangArticlePage({ params }: PageProps) {
  const { lang, slug } = await params;
  return <LangArticleClient langParam={lang} slug={slug} />;
}
