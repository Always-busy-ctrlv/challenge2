/**
 * ElectEd — Shared Middleware Tests
 * Coverage target: >99.5% on middleware.ts
 */

import { Request, Response } from 'express';
import {
  requestIdMiddleware,
  createRequestLogger,
  validateBody,
  validateQuery,
  sanitizeString,
  createErrorHandler,
  notFoundHandler,
  createCommonMiddleware,
  setupGracefulShutdown,
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

function mockRes(): Response & { _headers: Record<string, string> } {
  const res: any = {
    statusCode: 200,
    _headers: {} as Record<string, string>,
    setHeader: jest.fn((key: string, value: string) => { res._headers[key] = value; }),
    status: jest.fn(function (this: any, code: number) { this.statusCode = code; return this; }),
    json: jest.fn(function (this: any) { return this; }),
    on: jest.fn(),
  };
  return res as Response & { _headers: Record<string, string> };
}

describe('shared-middleware', () => {
  // ── requestIdMiddleware ────────────────────────
  describe('requestIdMiddleware', () => {
    it('generates request ID when none provided', () => {
      const req = mockReq();
      const res = mockRes();
      const next = jest.fn();

      requestIdMiddleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', expect.any(String));
      expect((req as any).requestId).toBeDefined();
      expect(typeof (req as any).requestId).toBe('string');
      expect(next).toHaveBeenCalled();
    });

    it('uses existing X-Request-Id header', () => {
      const req = mockReq({ headers: { 'x-request-id': 'existing-id' } });
      const res = mockRes();
      const next = jest.fn();

      requestIdMiddleware(req, res, next);

      expect((req as any).requestId).toBe('existing-id');
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', 'existing-id');
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

    it('uses requestId as traceId when no trace header', () => {
      const req = mockReq();
      const res = mockRes();
      const next = jest.fn();

      requestIdMiddleware(req, res, next);

      expect((req as any).traceId).toBe((req as any).requestId);
    });
  });

  // ── createRequestLogger ────────────────────────
  describe('createRequestLogger', () => {
    it('logs structured request data on response finish', () => {
      const mockLogger = { info: jest.fn() };
      const middleware = createRequestLogger(mockLogger);
      const req = mockReq({ method: 'POST', originalUrl: '/api/test' });
      const res = mockRes();
      const next = jest.fn();

      // Set requestId and traceId on req
      (req as any).requestId = 'req-123';
      (req as any).traceId = 'trace-456';

      middleware(req, res, next);

      // Should call next immediately
      expect(next).toHaveBeenCalled();

      // Simulate response finish event
      const finishHandler = (res.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'finish',
      );
      expect(finishHandler).toBeDefined();
      finishHandler![1]();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'request',
        expect.objectContaining({
          httpRequest: expect.objectContaining({
            requestMethod: 'POST',
            requestUrl: '/api/test',
            status: 200,
          }),
          requestId: 'req-123',
          traceId: 'trace-456',
        }),
      );
    });

    it('captures latency on finish', () => {
      const mockLogger = { info: jest.fn() };
      const middleware = createRequestLogger(mockLogger);
      const req = mockReq();
      const res = mockRes();

      (req as any).requestId = 'r1';
      (req as any).traceId = 't1';

      middleware(req, res, jest.fn());

      const finishHandler = (res.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'finish',
      )![1];
      finishHandler();

      const loggedMeta = mockLogger.info.mock.calls[0][1] as any;
      expect(loggedMeta.httpRequest.latency).toMatch(/^\d+ms$/);
    });
  });

  // ── validateBody ──────────────────────────────
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

    it('sets parsed data on req.body', () => {
      const req = mockReq({ body: { name: 'Test', age: 25 } });
      const res = mockRes();
      const next = jest.fn();

      validateBody(schema)(req, res, next);

      expect(req.body).toEqual({ name: 'Test', age: 25 });
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

    it('returns field-level details in validation error', () => {
      const req = mockReq({ body: {} });
      const res = mockRes();
      const next = jest.fn();

      validateBody(schema)(req, res, next);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.error.details.length).toBeGreaterThan(0);
      expect(response.error.details[0]).toHaveProperty('field');
      expect(response.error.details[0]).toHaveProperty('message');
      expect(response.error.details[0]).toHaveProperty('code');
    });
  });

  // ── validateQuery ─────────────────────────────
  describe('validateQuery', () => {
    const schema = z.object({ q: z.string().min(1) });

    it('passes valid query through', () => {
      const req = mockReq({ query: { q: 'voter' } });
      const res = mockRes();
      const next = jest.fn();

      validateQuery(schema)(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('sets validatedQuery on request', () => {
      const req = mockReq({ query: { q: 'voter' } });
      const res = mockRes();
      const next = jest.fn();

      validateQuery(schema)(req, res, next);

      expect((req as any).validatedQuery).toEqual({ q: 'voter' });
    });

    it('returns 400 for invalid query', () => {
      const req = mockReq({ query: { q: '' } });
      const res = mockRes();
      const next = jest.fn();

      validateQuery(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            message: 'Query validation failed',
          }),
        }),
      );
    });
  });

  // ── sanitizeString ────────────────────────────
  describe('sanitizeString', () => {
    it('strips HTML angle brackets', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('removes javascript: protocol', () => {
      expect(sanitizeString('javascript:void(0)')).toBe('void(0)');
    });

    it('removes event handlers', () => {
      expect(sanitizeString('onerror=alert(1)')).toBe('alert(1)');
    });

    it('removes onclick handlers', () => {
      expect(sanitizeString('onclick=steal()')).toBe('steal()');
    });

    it('trims whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('truncates to default max length (1000)', () => {
      const long = 'a'.repeat(2000);
      expect(sanitizeString(long).length).toBe(1000);
    });

    it('truncates to custom max length', () => {
      const long = 'a'.repeat(500);
      expect(sanitizeString(long, 100).length).toBe(100);
    });

    it('strips null bytes', () => {
      expect(sanitizeString('hel\0lo\0')).toBe('hello');
    });

    it('strips HTML entities', () => {
      expect(sanitizeString('&lt;script&gt;')).toBe('script');
    });

    it('strips numeric HTML entities', () => {
      expect(sanitizeString('&#60;img&#62;')).toBe('img');
    });

    it('applies unicode NFC normalization', () => {
      // ñ can be represented as U+00F1 (composed) or U+006E U+0303 (decomposed)
      const decomposed = 'n\u0303'; // ñ decomposed
      const composed = '\u00F1';    // ñ composed
      expect(sanitizeString(decomposed)).toBe(composed);
    });

    it('handles empty string', () => {
      expect(sanitizeString('')).toBe('');
    });

    it('handles string with only whitespace', () => {
      expect(sanitizeString('   ')).toBe('');
    });
  });

  // ── createErrorHandler ────────────────────────
  describe('createErrorHandler', () => {
    const mockLogger = { error: jest.fn(), info: jest.fn() };

    beforeEach(() => {
      mockLogger.error.mockClear();
    });

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
      expect(mockLogger.error).toHaveBeenCalled();
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

    it('maps status 400 to BAD_REQUEST code', () => {
      const handler = createErrorHandler(mockLogger);
      const err = Object.assign(new Error('bad'), { status: 400 });
      const req = mockReq();
      const res = mockRes();

      handler(err, req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.objectContaining({ code: 'BAD_REQUEST' }) }),
      );
    });

    it('maps status 401 to UNAUTHORIZED code', () => {
      const handler = createErrorHandler(mockLogger);
      const err = Object.assign(new Error('not authed'), { status: 401 });
      const req = mockReq();
      const res = mockRes();

      handler(err, req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.objectContaining({ code: 'UNAUTHORIZED' }) }),
      );
    });

    it('maps status 403 to FORBIDDEN code', () => {
      const handler = createErrorHandler(mockLogger);
      const err = Object.assign(new Error('forbidden'), { status: 403 });
      const req = mockReq();
      const res = mockRes();

      handler(err, req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.objectContaining({ code: 'FORBIDDEN' }) }),
      );
    });

    it('maps status 404 to NOT_FOUND code', () => {
      const handler = createErrorHandler(mockLogger);
      const err = Object.assign(new Error('not found'), { status: 404 });
      const req = mockReq();
      const res = mockRes();

      handler(err, req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.objectContaining({ code: 'NOT_FOUND' }) }),
      );
    });

    it('maps status 413 to PAYLOAD_TOO_LARGE code', () => {
      const handler = createErrorHandler(mockLogger);
      const err = Object.assign(new Error('too large'), { status: 413 });
      const req = mockReq();
      const res = mockRes();

      handler(err, req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.objectContaining({ code: 'PAYLOAD_TOO_LARGE' }) }),
      );
    });

    it('maps status 429 to RATE_LIMIT code', () => {
      const handler = createErrorHandler(mockLogger);
      const err = Object.assign(new Error('rate limit'), { status: 429 });
      const req = mockReq();
      const res = mockRes();

      handler(err, req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.objectContaining({ code: 'RATE_LIMIT' }) }),
      );
    });

    it('uses statusCode property as fallback', () => {
      const handler = createErrorHandler(mockLogger);
      const err = Object.assign(new Error('bad'), { statusCode: 422 });
      const req = mockReq();
      const res = mockRes();

      handler(err, req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('defaults to 500 when no status provided', () => {
      const handler = createErrorHandler(mockLogger);
      const req = mockReq();
      const res = mockRes();

      handler(new Error('no status'), req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.objectContaining({ code: 'INTERNAL_ERROR' }) }),
      );
    });

    it('does not log for client errors (< 500)', () => {
      const handler = createErrorHandler(mockLogger);
      const err = Object.assign(new Error('bad request'), { status: 400 });
      const req = mockReq();
      const res = mockRes();

      handler(err, req, res, jest.fn());

      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('uses fallback message when err.message is empty', () => {
      const handler = createErrorHandler(mockLogger);
      const err = Object.assign(new Error(''), { status: 400 });
      const req = mockReq();
      const res = mockRes();

      handler(err, req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ message: 'An unexpected error occurred' }),
        }),
      );
    });

    it('includes requestId in error log', () => {
      const handler = createErrorHandler(mockLogger);
      const req = mockReq();
      (req as any).requestId = 'err-req-123';
      const res = mockRes();

      handler(new Error('server fail'), req, res, jest.fn());

      expect(mockLogger.error).toHaveBeenCalledWith(
        'unhandled_error',
        expect.objectContaining({ requestId: 'err-req-123' }),
      );
    });
  });

  // ── notFoundHandler ───────────────────────────
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
            message: 'Endpoint GET /unknown not found',
          }),
        }),
      );
    });

    it('includes method in message for POST', () => {
      const req = mockReq({ method: 'POST', path: '/missing' });
      const res = mockRes();

      notFoundHandler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Endpoint POST /missing not found',
          }),
        }),
      );
    });
  });

  // ── createCommonMiddleware ─────────────────────
  describe('createCommonMiddleware', () => {
    const mockHelmet = jest.fn(() => 'helmet-middleware');
    const mockCors = jest.fn(() => 'cors-middleware');
    const mockCompression = jest.fn(() => 'compression-middleware');
    const mockJsonParser = jest.fn(() => 'json-middleware');
    const mockExpress = { json: mockJsonParser };
    const mockLogger = { info: jest.fn() };

    const deps = {
      helmet: mockHelmet,
      cors: mockCors,
      compression: mockCompression,
      express: mockExpress,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns an array of 6 middleware functions', () => {
      const middlewares = createCommonMiddleware(deps, { logger: mockLogger });

      expect(middlewares).toHaveLength(6);
      expect(middlewares[0]).toBe('helmet-middleware');
      expect(middlewares[1]).toBe('cors-middleware');
      expect(middlewares[2]).toBe('compression-middleware');
      expect(middlewares[3]).toBe('json-middleware');
      expect(middlewares[4]).toBe(requestIdMiddleware);
      expect(typeof middlewares[5]).toBe('function'); // createRequestLogger result
    });

    it('configures helmet with CSP including localhost in development', () => {
      createCommonMiddleware(deps, { logger: mockLogger, isProduction: false });

      const helmetConfig = mockHelmet.mock.calls[0][0];
      expect(helmetConfig.contentSecurityPolicy.directives.connectSrc).toContain('http://localhost:*');
    });

    it('configures helmet without localhost in production', () => {
      createCommonMiddleware(deps, { logger: mockLogger, isProduction: true });

      const helmetConfig = mockHelmet.mock.calls[0][0];
      expect(helmetConfig.contentSecurityPolicy.directives.connectSrc).not.toContain('http://localhost:*');
      expect(helmetConfig.contentSecurityPolicy.directives.connectSrc).toContain("'self'");
    });

    it('uses custom corsOrigin', () => {
      createCommonMiddleware(deps, { logger: mockLogger, corsOrigin: 'https://example.com' });

      const corsConfig = mockCors.mock.calls[0][0];
      expect(corsConfig.origin).toBe('https://example.com');
    });

    it('uses default corsOrigin from env', () => {
      const original = process.env.CORS_ORIGIN;
      process.env.CORS_ORIGIN = 'https://from-env.com';

      createCommonMiddleware(deps, { logger: mockLogger });

      const corsConfig = mockCors.mock.calls[0][0];
      expect(corsConfig.origin).toBe('https://from-env.com');
      process.env.CORS_ORIGIN = original;
    });

    it('falls back to localhost:3000 when no cors origin set', () => {
      const original = process.env.CORS_ORIGIN;
      delete process.env.CORS_ORIGIN;

      createCommonMiddleware(deps, { logger: mockLogger });

      const corsConfig = mockCors.mock.calls[0][0];
      expect(corsConfig.origin).toBe('http://localhost:3000');
      process.env.CORS_ORIGIN = original;
    });

    it('uses custom jsonLimit', () => {
      createCommonMiddleware(deps, { logger: mockLogger, jsonLimit: '50kb' });

      expect(mockJsonParser).toHaveBeenCalledWith({ limit: '50kb' });
    });

    it('uses default jsonLimit of 10kb', () => {
      createCommonMiddleware(deps, { logger: mockLogger });

      expect(mockJsonParser).toHaveBeenCalledWith({ limit: '10kb' });
    });

    it('appends custom cspConnectSrc directives', () => {
      createCommonMiddleware(deps, {
        logger: mockLogger,
        isProduction: true,
        cspConnectSrc: ['https://api.example.com'],
      });

      const helmetConfig = mockHelmet.mock.calls[0][0];
      expect(helmetConfig.contentSecurityPolicy.directives.connectSrc).toContain('https://api.example.com');
    });

    it('auto-detects production from NODE_ENV', () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      createCommonMiddleware(deps, { logger: mockLogger });

      const helmetConfig = mockHelmet.mock.calls[0][0];
      expect(helmetConfig.contentSecurityPolicy.directives.connectSrc).not.toContain('http://localhost:*');
      process.env.NODE_ENV = original;
    });

    it('configures HSTS in helmet', () => {
      createCommonMiddleware(deps, { logger: mockLogger });

      const helmetConfig = mockHelmet.mock.calls[0][0];
      expect(helmetConfig.strictTransportSecurity).toEqual({
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      });
    });
  });

  // ── setupGracefulShutdown ─────────────────────
  describe('setupGracefulShutdown', () => {
    const processOnSpy = jest.spyOn(process, 'on');

    beforeEach(() => {
      processOnSpy.mockClear();
    });

    it('registers SIGTERM and SIGINT handlers', () => {
      const mockServer = { close: jest.fn((cb) => cb()) };
      const mockLogger = { info: jest.fn() };
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      setupGracefulShutdown(mockServer, mockLogger);

      const sigTermCall = processOnSpy.mock.calls.find((c) => c[0] === 'SIGTERM');
      const sigIntCall = processOnSpy.mock.calls.find((c) => c[0] === 'SIGINT');
      expect(sigTermCall).toBeDefined();
      expect(sigIntCall).toBeDefined();

      mockExit.mockRestore();
    });

    it('runs cleanup functions on shutdown', async () => {
      const mockServer = { close: jest.fn((cb) => cb()) };
      const mockLogger = { info: jest.fn() };
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const cleanup1 = jest.fn();
      const cleanup2 = jest.fn().mockResolvedValue(undefined);

      setupGracefulShutdown(mockServer, mockLogger, [cleanup1, cleanup2]);

      // Find the SIGTERM handler and call it
      const sigTermCall = processOnSpy.mock.calls.find((c) => c[0] === 'SIGTERM');
      const handler = sigTermCall![1] as () => void;

      await handler();

      expect(cleanup1).toHaveBeenCalled();
      expect(cleanup2).toHaveBeenCalled();
      expect(mockServer.close).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('SIGTERM'));

      mockExit.mockRestore();
    });

    it('handles SIGINT signal', async () => {
      const mockServer = { close: jest.fn((cb) => cb()) };
      const mockLogger = { info: jest.fn() };
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      setupGracefulShutdown(mockServer, mockLogger);

      const sigIntCall = processOnSpy.mock.calls.find((c) => c[0] === 'SIGINT');
      const handler = sigIntCall![1] as () => void;

      await handler();

      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('SIGINT'));
      expect(mockServer.close).toHaveBeenCalled();

      mockExit.mockRestore();
    });

    it('handles cleanup function errors gracefully', async () => {
      const mockServer = { close: jest.fn((cb) => cb()) };
      const mockLogger = { info: jest.fn() };
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const failingCleanup = jest.fn().mockRejectedValue(new Error('cleanup failed'));

      setupGracefulShutdown(mockServer, mockLogger, [failingCleanup]);

      const sigTermCall = processOnSpy.mock.calls.find((c) => c[0] === 'SIGTERM');
      const handler = sigTermCall![1] as () => void;

      // Should not throw
      await handler();

      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cleanup error'));
      expect(mockServer.close).toHaveBeenCalled();

      mockExit.mockRestore();
    });

    it('prevents double shutdown', async () => {
      const mockServer = { close: jest.fn((cb) => cb()) };
      const mockLogger = { info: jest.fn() };
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      setupGracefulShutdown(mockServer, mockLogger);

      const sigTermCall = processOnSpy.mock.calls.find((c) => c[0] === 'SIGTERM');
      const handler = sigTermCall![1] as () => void;

      await handler();
      await handler(); // Second call should be no-op

      // Server.close should only be called once
      expect(mockServer.close).toHaveBeenCalledTimes(1);

      mockExit.mockRestore();
    });

    it('logs graceful close message and exits with 0', async () => {
      const closeCallback = jest.fn();
      const mockServer = {
        close: jest.fn((cb: () => void) => {
          closeCallback();
          cb();
        }),
      };
      const mockLogger = { info: jest.fn() };
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      setupGracefulShutdown(mockServer, mockLogger);

      const sigTermCall = processOnSpy.mock.calls.find((c) => c[0] === 'SIGTERM');
      const handler = sigTermCall![1] as () => void;

      await handler();

      expect(mockLogger.info).toHaveBeenCalledWith('Server closed gracefully');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });

    it('force exits after timeout when server.close hangs', async () => {
      jest.useFakeTimers();

      // Server.close never calls its callback (simulates hang)
      const mockServer = { close: jest.fn() };
      const mockLogger = { info: jest.fn() };
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      setupGracefulShutdown(mockServer, mockLogger);

      const sigTermCall = processOnSpy.mock.calls.find((c) => c[0] === 'SIGTERM');
      const handler = sigTermCall![1] as () => void;

      await handler();

      // Fast-forward 10 seconds
      jest.advanceTimersByTime(10000);

      expect(mockLogger.info).toHaveBeenCalledWith('Forced exit after timeout');
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
      jest.useRealTimers();
    });
  });
});
