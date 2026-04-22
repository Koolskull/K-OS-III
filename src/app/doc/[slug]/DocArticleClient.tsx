"use client";

import { useRouter } from "next/navigation";
import { Manual } from "@/components/doc/Manual";
import { ARTICLES_BY_SLUG } from "@/lib/doc/articles";

export default function DocArticleClient({ slug }: { slug: string }) {
  const router = useRouter();
  const initial = ARTICLES_BY_SLUG[slug] ? slug : null;
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Manual
        mode="route"
        initialSlug={initial}
        onSlugChange={(target) => {
          if (target === null) router.push(`/doc`);
          else router.push(`/doc/${target}`);
        }}
      />
    </div>
  );
}
