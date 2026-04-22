import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { successResponse, errorResponse } from '@elect-ed/shared-utils';
import {
  requestIdMiddleware,
  createRequestLogger,
  createErrorHandler,
  setupGracefulShutdown,
} from '@elect-ed/shared-utils/middleware.js';
import { createLogger, getAuth } from '@elect-ed/shared-firebase';

// ── Logger (Google Cloud Logging compatible) ────────────
const logger = createLogger('api-gateway');

const app: Application = express();
const PORT = process.env.API_GATEWAY_PORT || process.env.PORT || 8080;

const CONTENT_SERVICE_URL = process.env.CONTENT_SERVICE_URL || 'http://localhost:4001';
const QUIZ_SERVICE_URL = process.env.QUIZ_SERVICE_URL || 'http://localhost:4002';

// ── Security Middleware ─────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'http://localhost:*'],
    },
  },
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// ── Core Middleware ─────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(requestIdMiddleware);
app.use(createRequestLogger(logger));

// ── Rate Limiting (with periodic cleanup) ───────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function rateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    res.setHeader('X-RateLimit-Remaining', String(RATE_LIMIT - 1));
    res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT));
    return next();
  }

  if (entry.count >= RATE_LIMIT) {
    logger.warn('Rate limit exceeded', { ip, count: entry.count });
    res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
    res.status(429).json(errorResponse('RATE_LIMIT', 'Too many requests. Please try again later.'));
    return;
  }

  entry.count++;
  res.setHeader('X-RateLimit-Remaining', String(RATE_LIMIT - entry.count));
  res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT));
  next();
}

// Periodic cleanup of expired rate limit entries (prevent memory leak)
const rateLimitCleanupInterval = setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [ip, entry] of rateLimitStore) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(ip);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    logger.debug('Rate limit store cleanup', { cleaned, remaining: rateLimitStore.size });
  }
}, 60_000);

app.use(rateLimiter);

// ── Optional Firebase Auth Token Verification ───────────
async function optionalAuthMiddleware(
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);
  try {
    const auth = getAuth();
    const decoded = await auth.verifyIdToken(token);
    (req as any).userId = decoded.uid;
    (req as any).userEmail = decoded.email;
    logger.debug('Auth token verified', { uid: decoded.uid });
  } catch (error) {
    // Token invalid but we don't block — optional auth
    logger.debug('Auth token verification failed (non-blocking)');
  }

  next();
}

app.use(optionalAuthMiddleware);

// ── Health Check ────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json(successResponse({
    status: 'ok',
    service: 'api-gateway',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    dependencies: {
      contentService: CONTENT_SERVICE_URL,
      quizService: QUIZ_SERVICE_URL,
    },
    gcpProject: process.env.GCP_PROJECT_ID || 'not-configured',
  }));
});

// ── Proxy Helper ────────────────────────────────────────
async function proxyRequest(
  targetUrl: string,
  req: express.Request,
  res: express.Response
) {
  try {
    const url = new URL(req.originalUrl.replace('/api/v1', '/api'), targetUrl);

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': req.ip || '',
        'X-Request-Id': (req as any).requestId || '',
        'X-Forwarded-User': (req as any).userId || '',
      },
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout
    fetchOptions.signal = controller.signal;

    const response = await fetch(url.toString(), fetchOptions);
    clearTimeout(timeout);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      logger.error(`Proxy timeout for ${targetUrl}`, { path: req.originalUrl });
      res.status(504).json(errorResponse('GATEWAY_TIMEOUT', 'Upstream service timed out'));
    } else {
      logger.error(`Proxy error for ${targetUrl}`, { error: error.message, path: req.originalUrl });
      res.status(502).json(errorResponse('PROXY_ERROR', 'Upstream service unavailable'));
    }
  }
}

// ── Route: Content Service ──────────────────────────────
app.use('/api/v1/stages', (req, res) => {
  proxyRequest(CONTENT_SERVICE_URL, req, res);
});

app.use('/api/v1/glossary', (req, res) => {
  proxyRequest(CONTENT_SERVICE_URL, req, res);
});

app.use('/api/v1/glossary-categories', (req, res) => {
  proxyRequest(CONTENT_SERVICE_URL, req, res);
});

// ── Route: Quiz Service ─────────────────────────────────
app.use('/api/v1/quiz', (req, res) => {
  proxyRequest(QUIZ_SERVICE_URL, req, res);
});

// ── 404 Handler ─────────────────────────────────────────
app.use((req, res, next) => {
  if (req.path === '/api/test-error') {
    return next(new Error('Test internal error'));
  }
  res.status(404).json(errorResponse('NOT_FOUND', 'Endpoint not found'));
});

// ── Error Handler ───────────────────────────────────────
app.use(createErrorHandler(logger));

// ── Start Server ────────────────────────────────────────
const server = app.listen(PORT, () => {
  logger.info(`🚀 API Gateway running on port ${PORT}`, {
    port: PORT,
    contentService: CONTENT_SERVICE_URL,
    quizService: QUIZ_SERVICE_URL,
    gcpProject: process.env.GCP_PROJECT_ID,
  });
});

// ── Graceful Shutdown ───────────────────────────────────
setupGracefulShutdown(server, logger, [
  () => clearInterval(rateLimitCleanupInterval),
]);

export default app;
