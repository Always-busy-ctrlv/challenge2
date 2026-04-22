import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { successResponse, errorResponse } from '@elect-ed/shared-utils';

const app = express();
const PORT = process.env.PORT || 4000;

const CONTENT_SERVICE_URL = process.env.CONTENT_SERVICE_URL || 'http://localhost:4001';
const QUIZ_SERVICE_URL = process.env.QUIZ_SERVICE_URL || 'http://localhost:4002';

// ── Security Middleware ─────────────────────
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
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));

// ── Rate Limiting (in-memory for MVP) ───────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function rateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return next();
  }

  if (entry.count >= RATE_LIMIT) {
    res.status(429).json(errorResponse('RATE_LIMIT', 'Too many requests. Please try again later.'));
    return;
  }

  entry.count++;
  next();
}

app.use(rateLimiter);

// ── Request Logging ─────────────────────────
app.use((req, _res, next) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  }));
  next();
});

// ── Health Check ────────────────────────────
app.get('/health', (_req, res) => {
  res.json(successResponse({
    status: 'ok',
    service: 'api-gateway',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }));
});

// ── Proxy Helper ────────────────────────────
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
      },
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(url.toString(), fetchOptions);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    console.error(`Proxy error for ${targetUrl}:`, error);
    res.status(502).json(errorResponse('PROXY_ERROR', 'Upstream service unavailable'));
  }
}

// ── Route: Content Service ──────────────────
app.use('/api/v1/stages', (req, res) => {
  proxyRequest(CONTENT_SERVICE_URL, req, res);
});

app.use('/api/v1/glossary', (req, res) => {
  proxyRequest(CONTENT_SERVICE_URL, req, res);
});

app.use('/api/v1/glossary-categories', (req, res) => {
  proxyRequest(CONTENT_SERVICE_URL, req, res);
});

// ── Route: Quiz Service ─────────────────────
app.use('/api/v1/quiz', (req, res) => {
  proxyRequest(QUIZ_SERVICE_URL, req, res);
});

// ── 404 Handler ─────────────────────────────
app.use((req, res, next) => {
  if (req.path === '/api/test-error') {
    return next(new Error('Test internal error'));
  }
  res.status(404).json(errorResponse('NOT_FOUND', 'Endpoint not found'));
});

// ── Error Handler ───────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const statusCode = err.status || err.statusCode || 500;
  
  if (statusCode === 500) {
    console.error('Unhandled error:', err);
  }

  res.status(statusCode).json(errorResponse(
    statusCode === 400 ? 'BAD_REQUEST' : 'INTERNAL_ERROR',
    err.message || 'An unexpected error occurred'
  ));
});

// ── Start Server ────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`   → Content Service: ${CONTENT_SERVICE_URL}`);
  console.log(`   → Quiz Service: ${QUIZ_SERVICE_URL}`);
});

export default app;
