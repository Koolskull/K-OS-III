"use client";

import { useRouter } from "next/navigation";
import { Academy } from "@/components/academy/Academy";

export default function EduIndexPage() {
  const router = useRouter();
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Academy
        mode="route"
        lang="en"
        initialRef={null}
        onRefChange={(ref) => {
          if (ref) router.push(`/edu/${ref.track}/${ref.lesson}`);
        }}
        onLangChange={(lang, ref) => {
          if (lang === "en") {
            router.push(ref ? `/edu/${ref.track}/${ref.lesson}` : `/edu`);
          }
          // Non-EN routes to be added once translations ship.
        }}
      />
    </div>
  );
}
