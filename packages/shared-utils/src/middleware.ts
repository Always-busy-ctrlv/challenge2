/**
 * ElectEd — Shared Express Middleware
 *
 * Reusable middleware for all backend services:
 * - Request ID generation & propagation
 * - Structured request logging (GCP-compatible)
 * - Zod-based input validation
 * - Standardized error handling
 * - Input sanitization (XSS / injection defense)
 * - Common middleware factory (helmet, cors, compression)
 * - Graceful shutdown
 */

import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import type { ZodSchema, ZodError } from 'zod';
import type { AuthenticatedRequest } from '@elect-ed/shared-types';
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

  // Attach to request for downstream use (typed via AuthenticatedRequest)
  const typedReq = req as Request & AuthenticatedRequest;
  typedReq.requestId = requestId;
  typedReq.traceId = traceHeader?.split('/')[0] || requestId;

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
      const typedReq = req as Request & AuthenticatedRequest;
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
        requestId: typedReq.requestId,
        traceId: typedReq.traceId,
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
    const typedReq = req as Request & AuthenticatedRequest;
    typedReq.validatedQuery = result.data;
    next();
  };
}

// ── Input Sanitization ──────────────────────────────────
/**
 * Sanitize string inputs to prevent XSS / injection.
 * Defends against: HTML tags, JS protocol, event handlers,
 * null bytes, HTML entities, and unicode normalization attacks.
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .normalize('NFC')                    // Normalize unicode to canonical form
    .replace(/\0/g, '')                  // Strip null bytes
    .replace(/&#?\w+;/g, '')             // Strip HTML entities (&#60; &lt; etc.)
    .replace(/[<>]/g, '')                // Strip HTML angle brackets
    .replace(/javascript:/gi, '')        // Remove JS protocol
    .replace(/on\w+=/gi, '')             // Remove event handlers (onclick=, onerror=, etc.)
    .trim()
    .slice(0, maxLength);                // Max length guard
}

// ── Standardized Error Handler ──────────────────────────
/**
 * Express error handler that produces consistent error responses.
 * In production, masks internal error details.
 * Maps HTTP status codes to semantic error codes.
 */
export function createErrorHandler(logger: { error: (...args: unknown[]) => void }): ErrorRequestHandler {
  return (err: any, req: Request, res: Response, _next: NextFunction): void => {
    const statusCode = err.status || err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';
    const typedReq = req as Request & AuthenticatedRequest;

    if (statusCode >= 500) {
      logger.error('unhandled_error', {
        error: err.message,
        stack: err.stack,
        requestId: typedReq.requestId,
        path: req.path,
        method: req.method,
      });
    }

    const message = isProduction && statusCode >= 500
      ? 'An unexpected error occurred'
      : err.message || 'An unexpected error occurred';

    const codeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      413: 'PAYLOAD_TOO_LARGE',
      429: 'RATE_LIMIT',
    };
    const code = codeMap[statusCode] || 'INTERNAL_ERROR';

    res.status(statusCode).json(errorResponse(code, message));
  };
}

// ── 404 Handler ─────────────────────────────────────────
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(errorResponse('NOT_FOUND', `Endpoint ${req.method} ${req.path} not found`));
}

// ── Common Middleware Factory ────────────────────────────
/**
 * Creates the standard middleware stack shared across all services.
 * Eliminates duplicate helmet/cors/compression/json setup.
 */
export interface CommonMiddlewareOptions {
  /** CORS origin (default: env CORS_ORIGIN or http://localhost:3000) */
  corsOrigin?: string;
  /** JSON body size limit (default: '10kb') */
  jsonLimit?: string;
  /** Logger instance for request logging */
  logger: { info: (...args: unknown[]) => void };
  /** Additional CSP connect-src directives */
  cspConnectSrc?: string[];
  /** Whether running in production (default: auto-detect from NODE_ENV) */
  isProduction?: boolean;
}

/**
 * Returns an ordered array of middleware functions for Express.
 * Requires helmet, cors, compression to be passed in to avoid
 * this package depending on those heavy libraries directly.
 */
export function createCommonMiddleware(
  deps: {
    helmet: (opts: any) => any;
    cors: (opts: any) => any;
    compression: () => any;
    express: { json: (opts: any) => any };
  },
  options: CommonMiddlewareOptions,
) {
  const isProduction = options.isProduction ?? process.env.NODE_ENV === 'production';
  const corsOrigin = options.corsOrigin || process.env.CORS_ORIGIN || 'http://localhost:3000';
  const jsonLimit = options.jsonLimit || '10kb';

  const connectSrc: string[] = ["'self'"];
  if (!isProduction) {
    connectSrc.push('http://localhost:*');
  }
  if (options.cspConnectSrc) {
    connectSrc.push(...options.cspConnectSrc);
  }

  return [
    deps.helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc,
        },
      },
      strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      crossOriginEmbedderPolicy: false,
    }),
    deps.cors({
      origin: corsOrigin,
      credentials: true,
    }),
    deps.compression(),
    deps.express.json({ limit: jsonLimit }),
    requestIdMiddleware,
    createRequestLogger(options.logger),
  ];
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
