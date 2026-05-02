import request from 'supertest';

// Mock shared-firebase module before importing app
jest.mock('@elect-ed/shared-firebase', () => {
  const actual = jest.requireActual('@elect-ed/shared-firebase');
  return {
    ...actual,
    // isFirestoreAvailable resolves immediately to false (no real Firestore in tests)
    isFirestoreAvailable: jest.fn().mockResolvedValue(false),
    getVertexAIModel: jest.fn(() => ({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{ text: 'Voter registration is the process of signing up to vote.' }],
            },
          }],
        },
      }),
    })),
    // Stub getFirestore so if it's ever called in Firestore-enabled tests we can control it
    getFirestore: jest.fn(),
  };
});

import app from './index';
import { getFirestore, isFirestoreAvailable } from '@elect-ed/shared-firebase';

describe('quiz-service', () => {
  // ── Health Check ──────────────────────────────
  describe('GET /health', () => {
    it('returns 200 and status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(['ok', 'degraded']).toContain(res.body.data.status);
    });

    it('includes service metadata', async () => {
      const res = await request(app).get('/health');
      expect(res.body.data.service).toBe('quiz-service');
      expect(res.body.data.version).toBe('1.0.0');
      expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
      expect(res.body.data.timestamp).toBeDefined();
    });

    it('includes Firestore dependency status', async () => {
      const res = await request(app).get('/health');
      expect(res.body.data.dependencies).toBeDefined();
      expect(['connected', 'unavailable']).toContain(res.body.data.dependencies.firestore);
    });

    it('sets Cache-Control to no-store', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['cache-control']).toBe('no-store');
    });

    it('reports degraded when Firestore is unavailable', async () => {
      (isFirestoreAvailable as jest.Mock).mockResolvedValueOnce(false);
      const res = await request(app).get('/health');
      expect(res.body.data.status).toBe('degraded');
      expect(res.body.data.dependencies.firestore).toBe('unavailable');
    });

    it('reports ok when Firestore is available', async () => {
      (isFirestoreAvailable as jest.Mock).mockResolvedValueOnce(true);
      const res = await request(app).get('/health');
      expect(res.body.data.status).toBe('ok');
      expect(res.body.data.dependencies.firestore).toBe('connected');
    });

    it('handles isFirestoreAvailable rejection in health check', async () => {
      (isFirestoreAvailable as jest.Mock).mockRejectedValueOnce(new Error('timeout'));
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('degraded');
    });
  });

  // ── Get Quiz by Stage ─────────────────────────
  describe('GET /api/quiz/:stageId', () => {
    it('returns questions for a valid stage', async () => {
      const res = await request(app).get('/api/quiz/voter-registration');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).not.toHaveProperty('correctIndex');
      expect(res.body.data[0]).not.toHaveProperty('explanation');
    });

    it('includes _meta with total count', async () => {
      const res = await request(app).get('/api/quiz/voter-registration');
      expect(res.body.data[0]._meta).toBeDefined();
      expect(res.body.data[0]._meta.total).toBeGreaterThan(0);
    });

    it('filters by difficulty', async () => {
      const res = await request(app).get('/api/quiz/voter-registration?difficulty=easy');
      expect(res.status).toBe(200);
      res.body.data.forEach((q: any) => {
        expect(q.difficulty).toBe('easy');
      });
    });

    it('returns 400 for invalid difficulty', async () => {
      const res = await request(app).get('/api/quiz/voter-registration?difficulty=extreme');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_INPUT');
    });

    it('returns 404 for unknown stage', async () => {
      const res = await request(app).get('/api/quiz/unknown-stage');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('sets Cache-Control to no-cache', async () => {
      const res = await request(app).get('/api/quiz/voter-registration');
      expect(res.headers['cache-control']).toBe('no-cache');
    });
  });

  // ── Submit Quiz ───────────────────────────────
  describe('POST /api/quiz/submit', () => {
    const validPayload = {
      stageId: 'voter-registration',
      userId: 'user-1',
      answers: [
        { questionId: 'vr-1', selectedIndex: 2 }, // correct
        { questionId: 'vr-2', selectedIndex: 1 }, // incorrect
      ],
    };

    it('grades a valid submission', async () => {
      const res = await request(app).post('/api/quiz/submit').send(validPayload);
      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(50);
      expect(res.body.data.correctCount).toBe(1);
      expect(res.body.data.totalQuestions).toBe(2);
      expect(res.body.data.passed).toBe(false);
    });

    it('returns attempt ID', async () => {
      const res = await request(app).post('/api/quiz/submit').send(validPayload);
      expect(res.body.data.attemptId).toBeDefined();
      expect(typeof res.body.data.attemptId).toBe('string');
    });

    it('includes graded answers with explanations', async () => {
      const res = await request(app).post('/api/quiz/submit').send(validPayload);
      expect(res.body.data.answers).toBeDefined();
      expect(res.body.data.answers[0]).toHaveProperty('isCorrect');
      expect(res.body.data.answers[0]).toHaveProperty('explanation');
      expect(res.body.data.answers[0]).toHaveProperty('correctIndex');
    });

    it('handles anonymous submission', async () => {
      const res = await request(app).post('/api/quiz/submit').send({
        ...validPayload,
        userId: undefined,
      });
      expect(res.status).toBe(200);
      expect(res.body.data.score).toBeDefined();
    });

    it('returns 400 for invalid input (empty body)', async () => {
      const res = await request(app).post('/api/quiz/submit').send({});
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for empty answers array', async () => {
      const res = await request(app).post('/api/quiz/submit').send({
        stageId: 'voter-registration',
        answers: [],
      });
      expect(res.status).toBe(400);
    });

    it('returns 404 for unknown stage', async () => {
      const res = await request(app).post('/api/quiz/submit').send({
        ...validPayload,
        stageId: 'unknown',
      });
      expect(res.status).toBe(404);
    });

    it('skips unknown question IDs in submission', async () => {
      const res = await request(app).post('/api/quiz/submit').send({
        ...validPayload,
        answers: [{ questionId: 'unknown', selectedIndex: 0 }],
      });
      expect(res.status).toBe(200);
      expect(res.body.data.totalQuestions).toBe(0);
    });

    it('marks passed as true when score >= 70', async () => {
      const res = await request(app).post('/api/quiz/submit').send({
        stageId: 'voter-registration',
        userId: 'user-pass',
        answers: [
          { questionId: 'vr-1', selectedIndex: 2 }, // correct
        ],
      });
      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(100);
      expect(res.body.data.passed).toBe(true);
    });
  });

  // ── Progress and Leaderboard ──────────────────
  describe('Progress and Leaderboard', () => {
    it('returns user progress', async () => {
      // First submit something
      await request(app).post('/api/quiz/submit').send({
        stageId: 'voter-registration',
        userId: 'user-progress-1',
        answers: [{ questionId: 'vr-1', selectedIndex: 2 }],
      });

      const res = await request(app).get('/api/quiz/progress/user-progress-1');
      expect(res.status).toBe(200);
      expect(res.body.data.userId).toBe('user-progress-1');
      expect(res.body.data.totalAttempts).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.progress)).toBe(true);
      expect(res.body.data.totalStages).toBeGreaterThan(0);
    });

    it('handles multiple attempts for progress (best score tracking)', async () => {
      const userId = 'user-multi-progress';
      // Low score
      await request(app).post('/api/quiz/submit').send({
        stageId: 'voter-registration',
        userId,
        answers: [{ questionId: 'vr-1', selectedIndex: 0 }],
      });
      // High score
      await request(app).post('/api/quiz/submit').send({
        stageId: 'voter-registration',
        userId,
        answers: [{ questionId: 'vr-1', selectedIndex: 2 }],
      });

      const res = await request(app).get(`/api/quiz/progress/${userId}`);
      expect(res.body.data.progress[0].bestScore).toBe(100);
      expect(res.body.data.progress[0].attempts).toBe(2);
    });

    it('keeps best score when later attempt scores lower', async () => {
      const userId = 'user-highfirst';
      // High score first
      await request(app).post('/api/quiz/submit').send({
        stageId: 'voter-registration',
        userId,
        answers: [{ questionId: 'vr-1', selectedIndex: 2 }], // correct = 100%
      });
      // Low score second — exercises the else branch
      await request(app).post('/api/quiz/submit').send({
        stageId: 'voter-registration',
        userId,
        answers: [{ questionId: 'vr-1', selectedIndex: 0 }], // wrong = 0%
      });

      const res = await request(app).get(`/api/quiz/progress/${userId}`);
      expect(res.body.data.progress[0].bestScore).toBe(100);
      expect(res.body.data.progress[0].attempts).toBe(2);
    });

    it('returns progress for user with no attempts', async () => {
      const res = await request(app).get('/api/quiz/progress/nonexistent-user');
      expect(res.status).toBe(200);
      expect(res.body.data.totalAttempts).toBe(0);
      expect(res.body.data.progress).toEqual([]);
    });

    it('counts stages completed (score >= 70)', async () => {
      const userId = 'user-completed-stages';
      await request(app).post('/api/quiz/submit').send({
        stageId: 'voter-registration',
        userId,
        answers: [{ questionId: 'vr-1', selectedIndex: 2 }], // 100%
      });

      const res = await request(app).get(`/api/quiz/progress/${userId}`);
      expect(res.body.data.stagesCompleted).toBeGreaterThanOrEqual(1);
    });

    it('returns leaderboard', async () => {
      const res = await request(app).get('/api/quiz/leaderboard');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(10);
    });

    it('leaderboard entries have userId and topScore', async () => {
      // Submit to ensure there's data
      await request(app).post('/api/quiz/submit').send({
        stageId: 'voter-registration',
        userId: 'leaderboard-user',
        answers: [{ questionId: 'vr-1', selectedIndex: 2 }],
      });

      const res = await request(app).get('/api/quiz/leaderboard');
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('userId');
        expect(res.body.data[0]).toHaveProperty('topScore');
      }
    });

    it('leaderboard is sorted by top score descending', async () => {
      // Submit different scores
      await request(app).post('/api/quiz/submit').send({
        stageId: 'voter-registration',
        userId: 'lb-low',
        answers: [{ questionId: 'vr-1', selectedIndex: 0 }], // wrong
      });
      await request(app).post('/api/quiz/submit').send({
        stageId: 'voter-registration',
        userId: 'lb-high',
        answers: [{ questionId: 'vr-1', selectedIndex: 2 }], // correct
      });

      const res = await request(app).get('/api/quiz/leaderboard');
      if (res.body.data.length > 1) {
        expect(res.body.data[0].topScore).toBeGreaterThanOrEqual(res.body.data[1].topScore);
      }
    });
  });

  // ── AI Assistant ──────────────────────────────
  describe('POST /api/quiz/ask-ai', () => {
    it('returns AI response for valid question', async () => {
      const res = await request(app)
        .post('/api/quiz/ask-ai')
        .send({ question: 'What is voter registration?' });

      expect(res.status).toBe(200);
      expect(res.body.data.answer).toBeDefined();
      expect(res.body.data.model).toBeDefined();
      expect(res.body.data.sources).toBeDefined();
    });

    it('returns 400 for missing question', async () => {
      const res = await request(app)
        .post('/api/quiz/ask-ai')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_INPUT');
    });

    it('returns 400 for empty question string', async () => {
      const res = await request(app)
        .post('/api/quiz/ask-ai')
        .send({ question: '' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_INPUT');
    });

    it('returns 400 for whitespace-only question', async () => {
      const res = await request(app)
        .post('/api/quiz/ask-ai')
        .send({ question: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_INPUT');
    });

    it('returns 400 for non-string question', async () => {
      const res = await request(app)
        .post('/api/quiz/ask-ai')
        .send({ question: 42 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_INPUT');
    });

    it('returns 503 when Vertex AI fails', async () => {
      // Override the mock for this single test
      const { getVertexAIModel } = require('@elect-ed/shared-firebase');
      (getVertexAIModel as jest.Mock).mockReturnValueOnce({
        generateContent: jest.fn().mockRejectedValue(new Error('Vertex AI unavailable')),
      });

      const res = await request(app)
        .post('/api/quiz/ask-ai')
        .send({ question: 'What is an election?' });

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('AI_UNAVAILABLE');
    });

    it('handles empty Vertex AI response gracefully', async () => {
      const { getVertexAIModel } = require('@elect-ed/shared-firebase');
      (getVertexAIModel as jest.Mock).mockReturnValueOnce({
        generateContent: jest.fn().mockResolvedValue({
          response: { candidates: [] },
        }),
      });

      const res = await request(app)
        .post('/api/quiz/ask-ai')
        .send({ question: 'Tell me about voting' });

      expect(res.status).toBe(200);
      expect(res.body.data.answer).toBe('I could not generate a response.');
    });
  });

  // ── 404 Handler ───────────────────────────────
  describe('404 Handler', () => {
    it('returns 404 for unknown endpoint', async () => {
      const res = await request(app).get('/api/non-existent');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
