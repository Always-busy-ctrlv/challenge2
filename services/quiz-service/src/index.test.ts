import request from 'supertest';
import app from './index';

describe('quiz-service', () => {
  describe('GET /health', () => {
    it('returns 200 and healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
    });
  });

  describe('GET /api/quiz/:stageId', () => {
    it('returns questions for a valid stage', async () => {
      const res = await request(app).get('/api/quiz/voter-registration');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).not.toHaveProperty('correctIndex');
      expect(res.body.data[0]).not.toHaveProperty('explanation');
    });

    it('filters by difficulty', async () => {
      const res = await request(app).get('/api/quiz/voter-registration?difficulty=easy');
      expect(res.status).toBe(200);
      res.body.data.forEach((q: any) => {
        expect(q.difficulty).toBe('easy');
      });
    });

    it('returns 404 for unknown stage', async () => {
      const res = await request(app).get('/api/quiz/unknown-stage');
      expect(res.status).toBe(404);
    });
  });

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

    it('handles anonymous submission', async () => {
      const res = await request(app).post('/api/quiz/submit').send({
        ...validPayload,
        userId: undefined,
      });
      expect(res.status).toBe(200);
      expect(res.body.data.score).toBeDefined();
    });

    it('returns 400 for invalid input', async () => {
      const res = await request(app).post('/api/quiz/submit').send({});
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
  });

  describe('Progress and Leaderboard', () => {
    it('returns user progress', async () => {
      // First submit something
      await request(app).post('/api/quiz/submit').send({
        stageId: 'voter-registration',
        userId: 'user-1',
        answers: [{ questionId: 'vr-1', selectedIndex: 2 }],
      });

      const res = await request(app).get('/api/quiz/progress/user-1');
      expect(res.status).toBe(200);
      expect(res.body.data.userId).toBe('user-1');
      expect(res.body.data.totalAttempts).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.progress)).toBe(true);
    });

    it('handles multiple attempts for progress', async () => {
      const userId = 'user-multi';
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

    it('returns leaderboard', async () => {
      const res = await request(app).get('/api/quiz/leaderboard');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(10);
    });
  });
});
