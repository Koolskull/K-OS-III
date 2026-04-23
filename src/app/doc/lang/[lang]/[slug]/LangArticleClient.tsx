"use client";

import { useRouter } from "next/navigation";
import { Manual } from "@/components/doc/Manual";
import { ARTICLES_BY_SLUG, isLang, DEFAULT_LANG } from "@/lib/doc/articles";

export default function LangArticleClient({
  langParam,
  slug,
}: {
  langParam: string;
  slug: string;
}) {
  const router = useRouter();
  const lang = isLang(langParam) ? langParam : DEFAULT_LANG;
  const initial = ARTICLES_BY_SLUG[slug] ? slug : null;
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Manual
        mode="route"
        lang={lang}
        initialSlug={initial}
        onSlugChange={(target) => {
          if (target === null) {
            router.push(lang === "en" ? `/doc` : `/doc/lang/${lang}`);
          } else {
            router.push(lang === "en" ? `/doc/${target}` : `/doc/lang/${lang}/${target}`);
          }
        }}
        onLangChange={(next, current) => {
          if (next === "en") {
            router.push(current ? `/doc/${current}` : `/doc`);
          } else {
            router.push(current ? `/doc/lang/${next}/${current}` : `/doc/lang/${next}`);
          }
        }}
      />
    </div>
  );
}
