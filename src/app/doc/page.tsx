"use client";

import { useRouter } from "next/navigation";
import { Manual } from "@/components/doc/Manual";

export default function DocIndexPage() {
  const router = useRouter();
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Manual
        mode="route"
        lang="en"
        initialSlug={null}
        onSlugChange={(slug) => {
          if (slug) router.push(`/doc/${slug}`);
        }}
        onLangChange={(lang, slug) => {
          if (lang === "en") {
            router.push(slug ? `/doc/${slug}` : `/doc`);
          } else {
            router.push(slug ? `/doc/lang/${lang}/${slug}` : `/doc/lang/${lang}`);
          }
        }}
      />
    </div>
  );
}
