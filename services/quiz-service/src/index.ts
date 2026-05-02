import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { quizQuestions } from './data/quiz-questions.js';
import { successResponse, errorResponse, generateId, calculateScore } from '@elect-ed/shared-utils';
import {
  createCommonMiddleware,
  createErrorHandler,
  notFoundHandler,
  validateBody,
  sanitizeString,
  setupGracefulShutdown,
} from '@elect-ed/shared-utils/middleware.js';
import { quizSubmissionSchema } from '@elect-ed/shared-validation';
import {
  createLogger,
  getFirestore,
  getVertexAIModel,
  COLLECTIONS,
  isFirestoreAvailable,
} from '@elect-ed/shared-firebase';
import type { QuizAttempt, UserAnswer } from '@elect-ed/shared-types';

// ── Logger (Google Cloud Logging compatible) ────────────
const logger = createLogger('quiz-service');

const app: Application = express();
const PORT = process.env.QUIZ_SERVICE_PORT || process.env.PORT || 8080;

// ── Build O(1) Lookup Indexes ───────────────────────────
const questionsByStage = new Map<string, typeof quizQuestions>();
const questionById = new Map<string, (typeof quizQuestions)[0]>();

for (const q of quizQuestions) {
  questionById.set(q.id, q);
  const stageQuestions = questionsByStage.get(q.stageId) || [];
  stageQuestions.push(q);
  questionsByStage.set(q.stageId, stageQuestions);
}

logger.info('Quiz indexes built', {
  stages: questionsByStage.size,
  totalQuestions: questionById.size,
});

// ── In-memory fallback when Firestore unavailable ───────
const inMemoryAttempts: QuizAttempt[] = [];
let useFirestore = false;

// istanbul ignore next — async init resolves after module import; timing-dependent
isFirestoreAvailable().then((available) => {
  useFirestore = available;
  logger.info(`Firestore ${available ? 'connected ✓' : 'unavailable — using in-memory fallback'}`, {
    firestoreAvailable: available,
  });
}).catch(() => {
  logger.info('Firestore check failed — using in-memory fallback');
});

// ── Common Middleware (helmet, cors, compression, json, requestId, logger) ──
const commonMiddleware = createCommonMiddleware(
  { helmet, cors, compression, express },
  { logger },
);
commonMiddleware.forEach((mw) => app.use(mw));

// ── Health Check ────────────────────────────────────────
app.get('/health', async (_req, res) => {
  const firestoreOk = await isFirestoreAvailable().catch(() => false);
  res.setHeader('Cache-Control', 'no-store');
  res.json(successResponse({
    status: firestoreOk ? 'ok' : 'degraded',
    service: 'quiz-service',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    dependencies: {
      firestore: firestoreOk ? 'connected' : 'unavailable',
    },
    gcpProject: process.env.GCP_PROJECT_ID || 'not-configured',
  }));
});

// ── Get Leaderboard ─────────────────────────────────────
app.get('/api/quiz/leaderboard', async (_req, res) => {
  try {
    // istanbul ignore next — Firestore integration path (requires live Firestore)
    if (useFirestore) {
      const db = getFirestore();
      const snapshot = await db
        .collection(COLLECTIONS.LEADERBOARD)
        .orderBy('topScore', 'desc')
        .limit(10)
        .get();

      const leaderboard = snapshot.docs.map((doc) => ({
        userId: doc.data().userId,
        topScore: doc.data().topScore,
      }));

      res.setHeader('Cache-Control', 'public, max-age=30');
      res.json(successResponse(leaderboard));
      return;
    }

    // Fallback: in-memory
    const userScores = new Map<string, number>();
    for (const attempt of inMemoryAttempts) {
      const key = attempt.userId || 'anonymous';
      const current = userScores.get(key) || 0;
      userScores.set(key, Math.max(current, attempt.score));
    }

    const leaderboard = Array.from(userScores.entries())
      .map(([userId, topScore]) => ({ userId, topScore }))
      .sort((a, b) => b.topScore - a.topScore)
      .slice(0, 10);

    res.json(successResponse(leaderboard));
  } catch (error) /* istanbul ignore next — Firestore error path */ {
    logger.error('Leaderboard fetch error', { error });
    res.json(successResponse([]));
  }
});

// ── Get Quiz by Stage ───────────────────────────────────
app.get('/api/quiz/:stageId', (req, res) => {
  const stageId = sanitizeString(req.params.stageId);
  const difficulty = req.query.difficulty as string | undefined;
  const validDifficulties = ['easy', 'medium', 'hard'];

  let questions = questionsByStage.get(stageId);

  if (!questions || questions.length === 0) {
    res.status(404).json(errorResponse('NOT_FOUND', `No quiz found for stage "${stageId}"`));
    return;
  }

  // Copy to avoid mutating the index
  let filtered = [...questions];

  if (difficulty) {
    if (!validDifficulties.includes(difficulty)) {
      res.status(400).json(errorResponse('INVALID_INPUT', `Invalid difficulty. Use: ${validDifficulties.join(', ')}`));
      return;
    }
    filtered = filtered.filter((q) => q.difficulty === difficulty);
  }

  // Shuffle questions
  const shuffled = filtered.sort(() => Math.random() - 0.5);

  // Strip correct answers for client
  const clientQuestions = shuffled.map(({ correctIndex, explanation, ...q }) => ({
    ...q,
    _meta: { total: shuffled.length },
  }));

  res.setHeader('Cache-Control', 'no-cache');
  res.json(successResponse(clientQuestions));
});

// ── Submit Quiz Attempt (with Firestore persistence) ────
app.post('/api/quiz/submit', validateBody(quizSubmissionSchema), async (req, res) => {
  const { stageId, userId, answers } = req.body;

  const stageQuestions = questionsByStage.get(stageId);

  if (!stageQuestions || stageQuestions.length === 0) {
    res.status(404).json(errorResponse('NOT_FOUND', `No quiz found for stage "${stageId}"`));
    return;
  }

  const gradedAnswers: (UserAnswer & { explanation: string; correctIndex: number })[] = [];
  let correctCount = 0;

  for (const answer of answers) {
    const question = questionById.get(answer.questionId);
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

  // Persist to Firestore
  // istanbul ignore next — Firestore integration path (requires live Firestore)
  if (useFirestore) {
    try {
      const db = getFirestore();
      await db.collection(COLLECTIONS.QUIZ_ATTEMPTS).doc(attemptId).set(attempt);

      // Update leaderboard (upsert best score)
      if (userId) {
        const leaderboardRef = db.collection(COLLECTIONS.LEADERBOARD).doc(userId);
        const existing = await leaderboardRef.get();
        if (!existing.exists || (existing.data()?.topScore || 0) < score) {
          await leaderboardRef.set({
            userId,
            topScore: score,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
      }

      logger.info('Quiz attempt saved to Firestore', { attemptId, stageId, score });
    } catch (error) {
      logger.error('Firestore write failed, using in-memory fallback', { error });
      inMemoryAttempts.push(attempt);
    }
  } else {
    inMemoryAttempts.push(attempt);
  }

  res.json(successResponse({
    attemptId,
    score,
    totalQuestions: gradedAnswers.length,
    correctCount,
    passed: score >= 70,
    answers: gradedAnswers,
  }));
});

// ── Get User Progress ───────────────────────────────────
app.get('/api/quiz/progress/:userId', async (req, res) => {
  const userId = sanitizeString(req.params.userId);

  try {
    let userAttempts: QuizAttempt[];

    // istanbul ignore next — Firestore integration path (requires live Firestore)
    if (useFirestore) {
      const db = getFirestore();
      const snapshot = await db
        .collection(COLLECTIONS.QUIZ_ATTEMPTS)
        .where('userId', '==', userId)
        .orderBy('completedAt', 'desc')
        .limit(100)
        .get();

      userAttempts = snapshot.docs.map((doc) => doc.data() as QuizAttempt);
    } else {
      userAttempts = inMemoryAttempts.filter((a) => a.userId === userId);
    }

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
      userId,
      totalAttempts: userAttempts.length,
      stagesCompleted: progress.filter((p) => p.bestScore >= 70).length,
      totalStages: questionsByStage.size,
      progress,
    }));
  } catch (error) /* istanbul ignore next — Firestore error path */ {
    logger.error('Progress fetch error', { error, userId });
    res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch progress'));
  }
});

// ── AI Assistant — Ask about Elections (Vertex AI) ──────
app.post('/api/quiz/ask-ai', async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    res.status(400).json(errorResponse('INVALID_INPUT', 'Question is required'));
    return;
  }

  const sanitizedQuestion = sanitizeString(question);

  try {
    const model = getVertexAIModel();
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: sanitizedQuestion }],
      }],
    });

    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response.';

    logger.info('Vertex AI response generated', {
      questionLength: sanitizedQuestion.length,
      responseLength: text.length,
    });

    res.json(successResponse({
      answer: text,
      model: process.env.VERTEX_AI_MODEL || 'gemini-2.0-flash',
      sources: ['https://vote.gov', 'https://www.usa.gov/voter-registration'],
    }));
  } catch (error: any) {
    logger.error('Vertex AI error', { error: error.message });
    res.status(503).json(errorResponse(
      'AI_UNAVAILABLE',
      'AI assistant is currently unavailable. Please try again later.',
    ));
  }
});

// ── 404 + Error Handlers ────────────────────────────────
app.use(notFoundHandler);
app.use(createErrorHandler(logger));

// ── Start Server ────────────────────────────────────────
// istanbul ignore next — server startup
const server = app.listen(PORT, () => {
  logger.info(`🧠 Quiz Service running on port ${PORT}`, {
    port: PORT,
    nodeEnv: process.env.NODE_ENV || 'development',
    gcpProject: process.env.GCP_PROJECT_ID,
    firestoreEnabled: useFirestore,
    vertexAiModel: process.env.VERTEX_AI_MODEL || 'gemini-2.0-flash',
  });
});

// ── Graceful Shutdown ───────────────────────────────────
setupGracefulShutdown(server, logger);

export default app;
