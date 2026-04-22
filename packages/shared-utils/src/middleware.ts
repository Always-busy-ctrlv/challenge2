/**
 * ElectEd — Shared Express Middleware
 *
 * Reusable middleware for all backend services:
 * - Request ID generation & propagation
 * - Structured request logging (GCP-compatible)
 * - Zod-based input validation
 * - Standardized error handling
 * - Security headers (helmet wrapper)
 * - CORS configuration
 */

import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import type { ZodSchema, ZodError } from 'zod';
import { errorResponse } from './index.js';

// ── Request ID Middleware ────────────────────────────────
/**
 * Generates a unique request ID and attaches it to the request/response.
 * Propagates X-Cloud-Trace-Context for GCP trace correlation.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const traceHeader = req.headers['x-cloud-trace-context'] as string | undefined;
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();

  res.setHeader('X-Request-Id', requestId);

  // Attach to request for downstream use
  (req as any).requestId = requestId;
  (req as any).traceId = traceHeader?.split('/')[0] || requestId;

  next();
}

// ── Structured Request Logger ───────────────────────────
/**
 * Logs each request in structured JSON format compatible with Google Cloud Logging.
 */
export function createRequestLogger(logger: { info: (...args: unknown[]) => void }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('request', {
        httpRequest: {
          requestMethod: req.method,
          requestUrl: req.originalUrl,
          status: res.statusCode,
          userAgent: req.headers['user-agent'],
          remoteIp: req.ip,
          latency: `${duration}ms`,
          protocol: req.protocol,
        },
        requestId: (req as any).requestId,
        traceId: (req as any).traceId,
      });
    });

    next();
  };
}

// ── Zod Validation Middleware ────────────────────────────
/**
 * Validate request body against a Zod schema.
 * Returns 400 with field-level error details on failure.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const zodError = result.error as ZodError;
      const details = zodError.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      }));
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Request validation failed', details));
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validate request query parameters against a Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const zodError = result.error as ZodError;
      const details = zodError.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      }));
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Query validation failed', details));
      return;
    }
    (req as any).validatedQuery = result.data;
    next();
  };
}

// ── Input Sanitization ──────────────────────────────────
/**
 * Sanitize string inputs to prevent XSS / injection.
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Strip HTML angle brackets
    .replace(/javascript:/gi, '') // Remove JS protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 1000); // Max length guard
}

// ── Standardized Error Handler ──────────────────────────
/**
 * Express error handler that produces consistent error responses.
 * In production, masks internal error details.
 */
export function createErrorHandler(logger: { error: (...args: unknown[]) => void }): ErrorRequestHandler {
  return (err: any, req: Request, res: Response, _next: NextFunction): void => {
    const statusCode = err.status || err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    if (statusCode >= 500) {
      logger.error('unhandled_error', {
        error: err.message,
        stack: err.stack,
        requestId: (req as any).requestId,
        path: req.path,
        method: req.method,
      });
    }

    const message = isProduction && statusCode >= 500
      ? 'An unexpected error occurred'
      : err.message || 'An unexpected error occurred';

    const code = statusCode === 400 ? 'BAD_REQUEST'
      : statusCode === 413 ? 'PAYLOAD_TOO_LARGE'
      : statusCode === 429 ? 'RATE_LIMIT'
      : 'INTERNAL_ERROR';

    res.status(statusCode).json(errorResponse(code, message));
  };
}

// ── 404 Handler ─────────────────────────────────────────
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(errorResponse('NOT_FOUND', `Endpoint ${req.method} ${req.path} not found`));
}

// ── Graceful Shutdown ───────────────────────────────────
/**
 * Sets up graceful shutdown handlers for a server.
 */
export function setupGracefulShutdown(
  server: { close: (cb: () => void) => void },
  logger: { info: (...args: unknown[]) => void },
  cleanupFns: Array<() => void | Promise<void>> = [],
): void {
  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`${signal} received. Starting graceful shutdown...`);

    // Run cleanup functions
    for (const fn of cleanupFns) {
      try {
        await fn();
      } catch (err) {
        logger.info(`Cleanup error: ${err}`);
      }
    }

    server.close(() => {
      logger.info('Server closed gracefully');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      logger.info('Forced exit after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
