export type LessonStatus = "unread" | "reading" | "passed" | "failed";

export interface EducationLessonMeta {
  id: string;
  file: string;
  title: string;
  estimatedMinutes?: number;
}

export interface EducationTrackMeta {
  slug: string;
  title: string;
  summary: string;
  lessons: EducationLessonMeta[];
}

export interface QuizChoice {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: QuizChoice[];
  /** Choice id that is correct */
  correctId: string;
  /** Short explanation shown after submit */
  explain?: string;
}

export interface LessonQuiz {
  lessonId: string;
  passRatio: number;
  questions: QuizQuestion[];
}

export interface LessonProgress {
  status: LessonStatus;
  score?: number;
  total?: number;
  passedAt?: string;
  lastScoreAt?: string;
}

export type ProgressMap = Record<string, LessonProgress>;
