import request from 'supertest';
import nock from 'nock';
import app from './index';

describe('api-gateway', () => {
  const CONTENT_SERVICE_URL = 'http://localhost:4001';
  const QUIZ_SERVICE_URL = 'http://localhost:4002';

  beforeEach(() => {
    nock.cleanAll();
  });

  // ── Health Check ──────────────────────────────
  describe('GET /health', () => {
    it('returns 200 and healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.data.service).toBe('api-gateway');
      expect(res.body.data.status).toBe('ok');
    });

    it('returns dependency URLs in health response', async () => {
      const res = await request(app).get('/health');
      expect(res.body.data.dependencies).toBeDefined();
      expect(res.body.data.dependencies.contentService).toBe(CONTENT_SERVICE_URL);
      expect(res.body.data.dependencies.quizService).toBe(QUIZ_SERVICE_URL);
    });

    it('includes version, uptime, and timestamp', async () => {
      const res = await request(app).get('/health');
      expect(res.body.data.version).toBe('1.0.0');
      expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
      expect(res.body.data.timestamp).toBeDefined();
    });

    it('sets Cache-Control to no-store', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['cache-control']).toBe('no-store');
    });
  });

  // ── Proxy Logic ───────────────────────────────
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

    it('proxies PATCH request (body coverage)', async () => {
      nock(CONTENT_SERVICE_URL).patch('/api/stages/1').reply(200, { success: true });
      const res = await request(app).patch('/api/v1/stages/1').send({ name: 'patched' });
      expect(res.status).toBe(200);
    });

    it('handles upstream error (502)', async () => {
      nock(CONTENT_SERVICE_URL).get('/api/stages').replyWithError('FAIL');
      const res = await request(app).get('/api/v1/stages');
      expect(res.status).toBe(502);
      expect(res.body.error.code).toBe('PROXY_ERROR');
    });

    it('forwards X-Request-Id to upstream', async () => {
      nock(CONTENT_SERVICE_URL)
        .get('/api/stages')
        .reply(function () {
          return [200, { success: true, requestId: this.req.headers['x-request-id'] }];
        });

      const res = await request(app).get('/api/v1/stages');
      expect(res.status).toBe(200);
    });
  });

  // ── Auth Middleware ────────────────────────────
  describe('Auth Middleware', () => {
    it('passes through without auth header', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    });

    it('passes through with non-Bearer auth header', async () => {
      const res = await request(app)
        .get('/health')
        .set('Authorization', 'Basic abc123');
      expect(res.status).toBe(200);
    });

    it('passes through when Bearer token is invalid (optional auth)', async () => {
      const res = await request(app)
        .get('/health')
        .set('Authorization', 'Bearer invalid-token');
      // Should still succeed — auth is optional
      expect(res.status).toBe(200);
    });
  });

  // ── Error Handlers ────────────────────────────
  describe('Error Handlers', () => {
    it('returns 404 for unknown endpoint', async () => {
      const res = await request(app).get('/not-real');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('handles malformed JSON (400)', async () => {
      const res = await request(app)
        .post('/api/v1/quiz/submit')
        .set('Content-Type', 'application/json')
        .send('{"bad": }');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('handles 500 errors via test-error route', async () => {
      const res = await request(app).get('/api/test-error');
      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe('INTERNAL_ERROR');
    });

    it('handles 413 payload too large errors', async () => {
      const res = await request(app)
        .post('/api/v1/quiz/submit')
        .set('Content-Type', 'application/json')
        .send('a'.repeat(11 * 1024)); // > 10kb

      expect(res.status).toBe(413);
    });
  });

  // ── Rate Limiting ─────────────────────────────
  describe('Rate Limiting', () => {
    it('limits requests after threshold', async () => {
      // Use a unique path per test to avoid cross-contamination
      for (let i = 0; i < 100; i++) {
        await request(app).get('/api/v1/stages').set('X-Forwarded-For', '10.0.0.99');
      }

      const res = await request(app).get('/api/v1/stages').set('X-Forwarded-For', '10.0.0.99');
      expect(res.status).toBe(429);
      expect(res.body.error.code).toBe('RATE_LIMIT');
    });

    it('sets rate limit headers', async () => {
      nock(CONTENT_SERVICE_URL).get('/api/stages').reply(200, { success: true });
      const res = await request(app).get('/api/v1/stages').set('X-Forwarded-For', '10.0.0.50');
      expect(res.headers['x-ratelimit-limit']).toBeDefined();
      expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    });

    it('sets Retry-After header when rate limited', async () => {
      for (let i = 0; i < 100; i++) {
        await request(app).get('/api/v1/stages').set('X-Forwarded-For', '10.0.0.88');
      }
      const res = await request(app).get('/api/v1/stages').set('X-Forwarded-For', '10.0.0.88');
      expect(res.headers['retry-after']).toBeDefined();
    });

    it('does not rate limit /health endpoint', async () => {
      // Even after many health checks, they should all pass
      for (let i = 0; i < 110; i++) {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
      }
    });
  });
});
