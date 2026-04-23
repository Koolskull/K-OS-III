"use client";

import { useRouter } from "next/navigation";
import { Manual } from "@/components/doc/Manual";
import { isLang, DEFAULT_LANG } from "@/lib/doc/articles";

export default function LangIndexClient({ langParam }: { langParam: string }) {
  const router = useRouter();
  const lang = isLang(langParam) ? langParam : DEFAULT_LANG;
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Manual
        mode="route"
        lang={lang}
        initialSlug={null}
        onSlugChange={(slug) => {
          if (slug === null) {
            router.push(lang === "en" ? `/doc` : `/doc/lang/${lang}`);
          } else {
            router.push(lang === "en" ? `/doc/${slug}` : `/doc/lang/${lang}/${slug}`);
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
