import { z } from 'zod';

// ── Quiz Submission ─────────────────────────
export const quizAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedIndex: z.number().int().min(0).max(9),
});

export const quizSubmissionSchema = z.object({
  stageId: z.string().min(1),
  userId: z.string().optional(),
  answers: z.array(quizAnswerSchema).min(1).max(20),
});

// ── Chat Message ────────────────────────────
export const chatMessageSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(2000),
});

export const startSessionSchema = z.object({
  userId: z.string().optional(),
});

// ── Glossary Search ─────────────────────────
export const glossarySearchSchema = z.object({
  q: z.string().min(1).max(100),
});

// ── Calendar Reminder ───────────────────────
export const subscribeReminderSchema = z.object({
  userId: z.string().min(1),
  eventId: z.string().min(1),
  method: z.enum(['email', 'push']).default('email'),
});

// ── Pagination ──────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Region ──────────────────────────────────
export const regionSchema = z.object({
  region: z.string().min(2).max(20).default('federal'),
});

// Export types inferred from schemas
export type QuizSubmissionInput = z.infer<typeof quizSubmissionSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type GlossarySearchInput = z.infer<typeof glossarySearchSchema>;
export type SubscribeReminderInput = z.infer<typeof subscribeReminderSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type RegionInput = z.infer<typeof regionSchema>;
