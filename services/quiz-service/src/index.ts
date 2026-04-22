import express, { Application } from 'express';
import cors from 'cors';
import { quizQuestions } from './data/quiz-questions.js';
import { successResponse, errorResponse, generateId, calculateScore } from '@elect-ed/shared-utils';
import type { QuizAttempt, UserAnswer } from '@elect-ed/shared-types';

const app: Application = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// In-memory store for MVP (will migrate to Firestore)
const attempts: QuizAttempt[] = [];

// ── Health Check ────────────────────────────
app.get('/health', (_req, res) => {
  res.json(successResponse({
    status: 'ok',
    service: 'quiz-service',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }));
});

// ── Get Leaderboard ─────────────────────────
app.get('/api/quiz/leaderboard', (_req, res) => {
  // Aggregate best scores per user across all stages
  const userScores = new Map<string, number>();

  for (const attempt of attempts) {
    const key = attempt.userId || 'anonymous';
    const current = userScores.get(key) || 0;
    userScores.set(key, Math.max(current, attempt.score));
  }

  const leaderboard = Array.from(userScores.entries())
    .map(([userId, topScore]) => ({ userId, topScore }))
    .sort((a, b) => b.topScore - a.topScore)
    .slice(0, 10);

  res.json(successResponse(leaderboard));
});

// ── Get Quiz by Stage ───────────────────────
app.get('/api/quiz/:stageId', (req, res) => {
  const { stageId } = req.params;
  const difficulty = req.query.difficulty as string | undefined;

  let questions = quizQuestions.filter((q) => q.stageId === stageId);

  if (questions.length === 0) {
    res.status(404).json(errorResponse('NOT_FOUND', `No quiz found for stage "${stageId}"`));
    return;
  }

  if (difficulty) {
    questions = questions.filter((q) => q.difficulty === difficulty);
  }

  // Shuffle questions
  const shuffled = [...questions].sort(() => Math.random() - 0.5);

  // Strip correct answers for client
  const clientQuestions = shuffled.map(({ correctIndex, explanation, ...q }) => ({
    ...q,
    _meta: { total: shuffled.length },
  }));

  res.json(successResponse(clientQuestions));
});

// ── Submit Quiz Attempt ─────────────────────
app.post('/api/quiz/submit', (req, res) => {
  const { stageId, userId, answers } = req.body;

  if (!stageId || !answers || !Array.isArray(answers)) {
    res.status(400).json(errorResponse('INVALID_INPUT', 'stageId and answers array are required'));
    return;
  }

  const stageQuestions = quizQuestions.filter((q) => q.stageId === stageId);

  if (stageQuestions.length === 0) {
    res.status(404).json(errorResponse('NOT_FOUND', `No quiz found for stage "${stageId}"`));
    return;
  }

  const gradedAnswers: (UserAnswer & { explanation: string; correctIndex: number })[] = [];
  let correctCount = 0;

  for (const answer of answers) {
    const question = stageQuestions.find((q) => q.id === answer.questionId);
    if (!question) continue;

    const isCorrect = answer.selectedIndex === question.correctIndex;
    if (isCorrect) correctCount++;

    gradedAnswers.push({
      questionId: answer.questionId,
      selectedIndex: answer.selectedIndex,
      isCorrect,
      explanation: question.explanation,
      correctIndex: question.correctIndex,
    });
  }

  const score = calculateScore(correctCount, gradedAnswers.length);
  const attemptId = generateId();

  const attempt: QuizAttempt = {
    id: attemptId,
    userId: userId || undefined,
    stageId,
    score,
    totalQuestions: gradedAnswers.length,
    answers: gradedAnswers,
    completedAt: new Date().toISOString(),
  };

  attempts.push(attempt);

  res.json(successResponse({
    attemptId,
    score,
    totalQuestions: gradedAnswers.length,
    correctCount,
    passed: score >= 70,
    answers: gradedAnswers,
  }));
});

// ── Get User Progress ───────────────────────
app.get('/api/quiz/progress/:userId', (req, res) => {
  const userAttempts = attempts.filter((a) => a.userId === req.params.userId);

  // Group by stage and get best score
  const stageMap = new Map<string, { bestScore: number; attempts: number; lastAttempt: string }>();

  for (const attempt of userAttempts) {
    const existing = stageMap.get(attempt.stageId);
    if (!existing || attempt.score > existing.bestScore) {
      stageMap.set(attempt.stageId, {
        bestScore: attempt.score,
        attempts: (existing?.attempts || 0) + 1,
        lastAttempt: attempt.completedAt,
      });
    } else {
      stageMap.set(attempt.stageId, {
        ...existing,
        attempts: existing.attempts + 1,
        lastAttempt: attempt.completedAt,
      });
    }
  }

  const progress = Array.from(stageMap.entries()).map(([stageId, data]) => ({
    stageId,
    ...data,
  }));

  res.json(successResponse({
    userId: req.params.userId,
    totalAttempts: userAttempts.length,
    stagesCompleted: progress.filter((p) => p.bestScore >= 70).length,
    totalStages: 6,
    progress,
  }));
});



// ── Start Server ────────────────────────────
app.listen(PORT, () => {
  console.log(`🧠 Quiz Service running on port ${PORT}`);
});

export default app;
