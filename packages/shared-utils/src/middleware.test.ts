/**
 * ElectEd — Shared Middleware Tests
 */

import { Request, Response } from 'express';
import {
  requestIdMiddleware,
  validateBody,
  validateQuery,
  sanitizeString,
  createErrorHandler,
  notFoundHandler,
} from './middleware';
import { z } from 'zod';

// Helper to create mock request/response
function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    method: 'GET',
    path: '/test',
    originalUrl: '/test',
    ip: '127.0.0.1',
    protocol: 'http',
    body: {},
    query: {},
    ...overrides,
  } as unknown as Request;
}

function mockRes(): Response {
  const res: any = {
    statusCode: 200,
    _headers: {} as Record<string, string>,
    setHeader: jest.fn((key: string, value: string) => { res._headers[key] = value; }),
    status: jest.fn(function (this: any, code: number) { this.statusCode = code; return this; }),
    json: jest.fn(function (this: any) { return this; }),
    on: jest.fn(),
  };
  return res as Response;
}

describe('shared-middleware', () => {
  describe('requestIdMiddleware', () => {
    it('generates request ID when none provided', () => {
      const req = mockReq();
      const res = mockRes();
      const next = jest.fn();

      requestIdMiddleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', expect.any(String));
      expect((req as any).requestId).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('uses existing X-Request-Id header', () => {
      const req = mockReq({ headers: { 'x-request-id': 'existing-id' } });
      const res = mockRes();
      const next = jest.fn();

      requestIdMiddleware(req, res, next);

      expect((req as any).requestId).toBe('existing-id');
    });

    it('extracts trace ID from X-Cloud-Trace-Context', () => {
      const req = mockReq({
        headers: { 'x-cloud-trace-context': 'trace123/span456;o=1' },
      });
      const res = mockRes();
      const next = jest.fn();

      requestIdMiddleware(req, res, next);

      expect((req as any).traceId).toBe('trace123');
    });
  });

  describe('validateBody', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().int().positive(),
    });

    it('passes valid body through', () => {
      const req = mockReq({ body: { name: 'Test', age: 25 } });
      const res = mockRes();
      const next = jest.fn();

      validateBody(schema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid body', () => {
      const req = mockReq({ body: { name: '', age: -1 } });
      const res = mockRes();
      const next = jest.fn();

      validateBody(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('validateQuery', () => {
    const schema = z.object({ q: z.string().min(1) });

    it('passes valid query through', () => {
      const req = mockReq({ query: { q: 'voter' } });
      const res = mockRes();
      const next = jest.fn();

      validateQuery(schema)(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('returns 400 for invalid query', () => {
      const req = mockReq({ query: { q: '' } });
      const res = mockRes();
      const next = jest.fn();

      validateQuery(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('sanitizeString', () => {
    it('strips HTML tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('removes javascript: protocol', () => {
      expect(sanitizeString('javascript:void(0)')).toBe('void(0)');
    });

    it('removes event handlers', () => {
      expect(sanitizeString('onerror=alert(1)')).toBe('alert(1)');
    });

    it('trims whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('truncates long strings', () => {
      const long = 'a'.repeat(2000);
      expect(sanitizeString(long).length).toBe(1000);
    });
  });

  describe('createErrorHandler', () => {
    const mockLogger = { error: jest.fn(), info: jest.fn() };

    it('handles 500 errors and masks message in production', () => {
      const handler = createErrorHandler(mockLogger);
      const req = mockReq();
      const res = mockRes();
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      handler(new Error('secret db error'), req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ message: 'An unexpected error occurred' }),
        }),
      );
      process.env.NODE_ENV = originalEnv;
    });

    it('shows error message in development', () => {
      const handler = createErrorHandler(mockLogger);
      const req = mockReq();
      const res = mockRes();

      handler(new Error('debug info'), req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ message: 'debug info' }),
        }),
      );
    });

    it('handles custom status codes', () => {
      const handler = createErrorHandler(mockLogger);
      const err = Object.assign(new Error('bad'), { status: 400 });
      const req = mockReq();
      const res = mockRes();

      handler(err, req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('notFoundHandler', () => {
    it('returns 404 with endpoint info', () => {
      const req = mockReq({ method: 'GET', path: '/unknown' });
      const res = mockRes();

      notFoundHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'NOT_FOUND',
          }),
        }),
      );
    });
  });
});
