import request from 'supertest';
import app from './index';

describe('content-service', () => {
  // ── Health Check ──────────────────────────────
  describe('GET /health', () => {
    it('returns 200 and healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.data.service).toBe('content-service');
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

  // ── Timeline Stages ───────────────────────────
  describe('GET /api/stages', () => {
    it('returns all timeline stages', async () => {
      const res = await request(app).get('/api/stages');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('sets caching headers', async () => {
      const res = await request(app).get('/api/stages');
      expect(res.headers['cache-control']).toContain('public');
      expect(res.headers['etag']).toBeDefined();
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

    it('returns a single stage by slug', async () => {
      const all = await request(app).get('/api/stages');
      const slug = all.body.data[0].slug;

      const res = await request(app).get(`/api/stages/${slug}`);
      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe(slug);
    });

    it('returns 404 for unknown stage', async () => {
      const res = await request(app).get('/api/stages/unknown-stage');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('sanitizes input in stage lookup', async () => {
      const res = await request(app).get('/api/stages/<script>alert(1)</script>');
      expect(res.status).toBe(404);
      // Should not contain raw HTML in response
      expect(JSON.stringify(res.body)).not.toContain('<script>');
    });
  });

  // ── Glossary ──────────────────────────────────
  describe('GET /api/glossary', () => {
    it('returns glossary terms', async () => {
      const res = await request(app).get('/api/glossary');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.totalItems).toBeGreaterThan(0);
    });

    it('returns sorted results', async () => {
      const res = await request(app).get('/api/glossary');
      const terms = res.body.data.map((t: any) => t.term);
      const sorted = [...terms].sort((a: string, b: string) => a.localeCompare(b));
      expect(terms).toEqual(sorted);
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

    it('combines category and search filters', async () => {
      const res = await request(app).get('/api/glossary?category=Voting Rights&q=voter');
      expect(res.status).toBe(200);
      res.body.data.forEach((term: any) => {
        expect(term.category).toBe('Voting Rights');
      });
    });

    it('returns empty array for non-matching filters', async () => {
      const res = await request(app).get('/api/glossary?category=NonExistentCategory');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.totalItems).toBe(0);
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
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('resolves term by ID fallback when slug fails', async () => {
      // First, get a valid term to find its ID
      const allTerms = await request(app).get('/api/glossary');
      const firstTerm = allTerms.body.data[0];
      // Lookup by ID instead of slug
      const res = await request(app).get(`/api/glossary/${firstTerm.id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(firstTerm.id);
    });
  });

  // ── Glossary Categories ───────────────────────
  describe('GET /api/glossary-categories', () => {
    it('returns sorted categories', async () => {
      const res = await request(app).get('/api/glossary-categories');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toEqual([...res.body.data].sort());
    });

    it('returns unique categories', async () => {
      const res = await request(app).get('/api/glossary-categories');
      const unique = [...new Set(res.body.data)];
      expect(res.body.data.length).toBe(unique.length);
    });
  });

  // ── 404 Handler ───────────────────────────────
  describe('404 Handler', () => {
    it('returns 404 for unknown GET endpoint', async () => {
      const res = await request(app).get('/api/non-existent');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 404 for unknown POST endpoint', async () => {
      const res = await request(app).post('/api/non-existent');
      expect(res.status).toBe(404);
    });
  });
});
