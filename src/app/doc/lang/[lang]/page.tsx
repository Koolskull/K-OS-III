import { LANGUAGES } from "@/lib/doc/articles";
import LangIndexClient from "./LangIndexClient";

/** Pre-render one HTML index per language (excluding English, which lives at /doc). */
export function generateStaticParams() {
  return LANGUAGES.filter((l) => l !== "en").map((lang) => ({ lang }));
}

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function LangIndexPage({ params }: PageProps) {
  const { lang } = await params;
  return <LangIndexClient langParam={lang} />;
}
