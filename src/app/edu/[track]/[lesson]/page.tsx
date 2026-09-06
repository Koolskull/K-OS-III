import { allLessonPaths } from "@/lib/education/tracks";
import LessonClient from "./LessonClient";

/**
 * Pre-render one HTML file per (track, lesson) pair at build time.
 * Required for static export (output: 'export').
 */
export function generateStaticParams() {
  return allLessonPaths();
}

interface PageProps {
  params: Promise<{ track: string; lesson: string }>;
}

export default async function LessonPage({ params }: PageProps) {
  const { track, lesson } = await params;
  return <LessonClient track={track} lesson={lesson} />;
}
