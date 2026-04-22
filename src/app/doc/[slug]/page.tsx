import { ARTICLES } from "@/lib/doc/articles";
import DocArticleClient from "./DocArticleClient";

/**
 * Pre-render one HTML file per article slug at build time.
 * Required for static export (output: 'export').
 */
export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DocArticlePage({ params }: PageProps) {
  const { slug } = await params;
  return <DocArticleClient slug={slug} />;
}
