// ──────────────────────────────────────────────
// ElectEd — Shared Type Definitions
// ──────────────────────────────────────────────

export type Locale = 'en' | 'es';

// ── Timeline / Election Stages ──────────────
export interface TimelineStage {
  id: string;
  order: number;
  title: string;
  slug: string;
  summary: string;
  icon: string;
  details: StageDetail[];
  faqs: FAQ[];
  didYouKnow: string[];
}

export interface StageDetail {
  heading: string;
  content: string;
}

export interface FAQ {
  question: string;
  answer: string;
  source?: string;
}

// ── Quiz / Assessment ───────────────────────
export type QuestionType = 'mcq' | 'true-false';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface QuizQuestion {
  id: string;
  stageId: string;
  type: QuestionType;
  difficulty: Difficulty;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  source?: string;
}

export interface QuizAttempt {
  id: string;
  userId?: string;
  stageId: string;
  score: number;
  totalQuestions: number;
  answers: UserAnswer[];
  completedAt: string;
}

export interface UserAnswer {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
}

export interface QuizSubmission {
  stageId: string;
  userId?: string;
  answers: { questionId: string; selectedIndex: number }[];
}

export interface QuizResult {
  attemptId: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  answers: (UserAnswer & { explanation: string; correctIndex: number })[];
}

// ── User / Auth ─────────────────────────────
export interface User {
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  locale: Locale;
  createdAt: string;
  progress: StageProgress[];
}

export interface StageProgress {
  stageId: string;
  completed: boolean;
  quizBestScore: number;
  quizAttempts: number;
  lastAccessedAt: string;
}

// ── Chat / AI Assistant ─────────────────────
export interface ChatSession {
  id: string;
  userId?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: SourceCitation[];
  suggestedQuestions?: string[];
  timestamp: string;
}

export interface SourceCitation {
  title: string;
  url: string;
  snippet?: string;
}

// ── Election Calendar ───────────────────────
export type EventCategory = 'deadline' | 'primary' | 'election' | 'runoff' | 'certification';

export interface ElectionEvent {
  id: string;
  title: string;
  region: string;
  category: EventCategory;
  date: string;
  description: string;
  officialUrl: string;
}

// ── Glossary ────────────────────────────────
export interface GlossaryTerm {
  id: string;
  term: string;
  slug: string;
  definition: string;
  relatedTerms: string[];
  category: string;
}

// ── API Response Wrappers ───────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    totalPages?: number;
    totalItems?: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ── Health Check ────────────────────────────
export interface HealthCheck {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
}
