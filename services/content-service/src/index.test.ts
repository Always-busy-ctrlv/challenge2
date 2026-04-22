import request from 'supertest';
import app from './index';

describe('content-service', () => {
  describe('GET /health', () => {
    it('returns 200 and healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.data.service).toBe('content-service');
    });
  });

  describe('GET /api/stages', () => {
    it('returns all timeline stages', async () => {
      const res = await request(app).get('/api/stages');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/stages/:id', () => {
    it('returns a single stage by id', async () => {
      const all = await request(app).get('/api/stages');
      const stageId = all.body.data[0].id;
      
      const res = await request(app).get(`/api/stages/${stageId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(stageId);
    });

    it('returns 404 for unknown stage', async () => {
      const res = await request(app).get('/api/stages/unknown-stage');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/glossary', () => {
    it('returns glossary terms', async () => {
      const res = await request(app).get('/api/glossary');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('filters by category', async () => {
      const res = await request(app).get('/api/glossary?category=Voting Rights');
      expect(res.status).toBe(200);
      res.body.data.forEach((term: any) => {
        expect(term.category).toBe('Voting Rights');
      });
    });

    it('searches for terms fuzzily', async () => {
      const res = await request(app).get('/api/glossary?q=voter');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/glossary/:slug', () => {
    it('returns a single term with resolved relatives', async () => {
      const res = await request(app).get('/api/glossary/absentee-ballot');
      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe('absentee-ballot');
      expect(Array.isArray(res.body.data.relatedTermsResolved)).toBe(true);
    });

    it('returns 404 for unknown term', async () => {
      const res = await request(app).get('/api/glossary/non-existent-term');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/glossary-categories', () => {
    it('returns sorted categories', async () => {
      const res = await request(app).get('/api/glossary-categories');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toEqual([...res.body.data].sort());
    });
  });
});
