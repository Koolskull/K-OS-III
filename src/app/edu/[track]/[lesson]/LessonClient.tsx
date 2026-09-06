"use client";

import { useRouter } from "next/navigation";
import { Academy } from "@/components/academy/Academy";
import { getLesson } from "@/lib/education/tracks";

export default function LessonClient({
  track,
  lesson,
}: {
  track: string;
  lesson: string;
}) {
  const router = useRouter();
  const initial = getLesson(track, lesson) ? { track, lesson } : null;
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Academy
        mode="route"
        lang="en"
        initialRef={initial}
        onRefChange={(target) => {
          if (target === null) router.push(`/edu`);
          else router.push(`/edu/${target.track}/${target.lesson}`);
        }}
        onLangChange={(nextLang, current) => {
          if (nextLang === "en") {
            router.push(
              current ? `/edu/${current.track}/${current.lesson}` : `/edu`,
            );
          }
          // Non-EN routes to be added once translations ship.
        }}
      />
    </div>
  );
}
