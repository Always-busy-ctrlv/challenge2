import request from 'supertest';
import nock from 'nock';
import app from './index';

describe('api-gateway', () => {
  const CONTENT_SERVICE_URL = 'http://localhost:4001';
  const QUIZ_SERVICE_URL = 'http://localhost:4002';

  beforeEach(() => {
    nock.cleanAll();
  });

  describe('GET /health', () => {
    it('returns 200 and healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.data.service).toBe('api-gateway');
    });
  });



  describe('Proxy Logic', () => {
    it('proxies request to /api/v1/stages', async () => {
      nock(CONTENT_SERVICE_URL).get('/api/stages').reply(200, { success: true });
      const res = await request(app).get('/api/v1/stages');
      expect(res.status).toBe(200);
    });

    it('proxies request to /api/v1/glossary', async () => {
      nock(CONTENT_SERVICE_URL).get('/api/glossary').reply(200, { success: true });
      const res = await request(app).get('/api/v1/glossary');
      expect(res.status).toBe(200);
    });

    it('proxies request to /api/v1/glossary-categories', async () => {
      nock(CONTENT_SERVICE_URL).get('/api/glossary-categories').reply(200, { success: true });
      const res = await request(app).get('/api/v1/glossary-categories');
      expect(res.status).toBe(200);
    });

    it('proxies POST request to /api/v1/quiz', async () => {
      const mockPayload = { stageId: 's1', answers: [] };
      nock(QUIZ_SERVICE_URL).post('/api/quiz/submit', mockPayload).reply(200, { success: true });
      const res = await request(app).post('/api/v1/quiz/submit').send(mockPayload);
      expect(res.status).toBe(200);
    });

    it('proxies PUT request (body coverage)', async () => {
      nock(CONTENT_SERVICE_URL).put('/api/stages/1').reply(200, { success: true });
      const res = await request(app).put('/api/v1/stages/1').send({ name: 'updated' });
      expect(res.status).toBe(200);
    });

    it('handles upstream error (502)', async () => {
      nock(CONTENT_SERVICE_URL).get('/api/stages').replyWithError('FAIL');
      const res = await request(app).get('/api/v1/stages');
      expect(res.status).toBe(502);
    });
  });

  describe('Error Handlers', () => {
    it('returns 404 for unknown endpoint', async () => {
      const res = await request(app).get('/not-real');
      expect(res.status).toBe(404);
    });

    it('handles malformed JSON (400)', async () => {
      const res = await request(app)
        .post('/api/v1/quiz/submit')
        .set('Content-Type', 'application/json')
        .send('{"bad": }');
      
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('handles 500 errors', async () => {
      const res = await request(app).get('/api/test-error');
      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe('INTERNAL_ERROR');
    });

    it('handles 413 errors', async () => {
      const res = await request(app)
        .post('/api/v1/quiz/submit')
        .set('Content-Type', 'application/json')
        .send('a'.repeat(11 * 1024)); // > 10kb
      
      expect(res.status).toBe(413);
    });
  });

  describe('Rate Limiting', () => {
    it('limits requests after threshold', async () => {
      for (let i = 0; i < 100; i++) {
        await request(app).get('/health');
      }
      
      const res = await request(app).get('/health');
      expect(res.status).toBe(429);
    });
  });
});
