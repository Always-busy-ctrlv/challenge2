import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { timelineStages } from './data/timeline-stages.js';
import { glossaryTerms } from './data/glossary-terms.js';
import { successResponse, errorResponse, fuzzyMatch } from '@elect-ed/shared-utils';
import {
  requestIdMiddleware,
  createRequestLogger,
  createErrorHandler,
  notFoundHandler,
  sanitizeString,
  setupGracefulShutdown,
} from '@elect-ed/shared-utils/middleware.js';
import { createLogger } from '@elect-ed/shared-firebase';

// ── Logger (Google Cloud Logging compatible) ────────────
const logger = createLogger('content-service');

const app: Application = express();
const PORT = process.env.CONTENT_SERVICE_PORT || process.env.PORT || 8080;

// ── Build O(1) Lookup Indexes ───────────────────────────
const stageById = new Map<string, (typeof timelineStages)[0]>();
const stageBySlug = new Map<string, (typeof timelineStages)[0]>();
for (const stage of timelineStages) {
  stageById.set(stage.id, stage);
  stageBySlug.set(stage.slug, stage);
}

const glossaryById = new Map<string, (typeof glossaryTerms)[0]>();
const glossaryBySlug = new Map<string, (typeof glossaryTerms)[0]>();
for (const term of glossaryTerms) {
  glossaryById.set(term.id, term);
  glossaryBySlug.set(term.slug, term);
}

logger.info('Data indexes built', {
  stages: stageById.size,
  glossaryTerms: glossaryById.size,
});

// ── Security Middleware ─────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
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

// ── Health Check ────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json(successResponse({
    status: 'ok',
    service: 'content-service',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    gcpProject: process.env.GCP_PROJECT_ID || 'not-configured',
  }));
});

// ── Timeline Stages ─────────────────────────────────────
app.get('/api/stages', (_req, res) => {
  // Static content — cache aggressively
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  res.setHeader('ETag', `W/"stages-v1-${timelineStages.length}"`);
  res.json(successResponse(timelineStages));
});

app.get('/api/stages/:id', (req, res) => {
  const { id } = req.params;
  const sanitizedId = sanitizeString(id);
  const stage = stageById.get(sanitizedId) || stageBySlug.get(sanitizedId);

  if (!stage) {
    res.status(404).json(errorResponse('NOT_FOUND', `Stage "${sanitizedId}" not found`));
    return;
  }

  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  res.json(successResponse(stage));
});

// ── Glossary ────────────────────────────────────────────
app.get('/api/glossary', (req, res) => {
  const query = (req.query.q as string)?.trim();
  const category = req.query.category as string | undefined;

  let results = [...glossaryTerms];

  if (category) {
    const sanitizedCategory = sanitizeString(category);
    results = results.filter((t) => t.category.toLowerCase() === sanitizedCategory.toLowerCase());
  }

  if (query) {
    const sanitizedQuery = sanitizeString(query);
    results = results.filter(
      (t) => fuzzyMatch(sanitizedQuery, t.term) || fuzzyMatch(sanitizedQuery, t.definition)
    );
  }

  // Sort alphabetically
  results.sort((a, b) => a.term.localeCompare(b.term));

  res.setHeader('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');
  res.json(successResponse(results, { totalItems: results.length }));
});

app.get('/api/glossary/:slug', (req, res) => {
  const sanitizedSlug = sanitizeString(req.params.slug);
  const term = glossaryBySlug.get(sanitizedSlug) || glossaryById.get(sanitizedSlug);

  if (!term) {
    res.status(404).json(errorResponse('NOT_FOUND', `Term "${sanitizedSlug}" not found`));
    return;
  }

  // Resolve related terms
  const related = term.relatedTerms
    .map((slug) => glossaryBySlug.get(slug) || glossaryById.get(slug))
    .filter(Boolean);

  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json(successResponse({ ...term, relatedTermsResolved: related }));
});

// ── Glossary Categories ─────────────────────────────────
app.get('/api/glossary-categories', (_req, res) => {
  const categories = [...new Set(glossaryTerms.map((t) => t.category))].sort();
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json(successResponse(categories));
});

// ── 404 + Error Handlers ────────────────────────────────
app.use(notFoundHandler);
app.use(createErrorHandler(logger));

// ── Start Server ────────────────────────────────────────
const server = app.listen(PORT, () => {
  logger.info(`📚 Content Service running on port ${PORT}`, {
    port: PORT,
    nodeEnv: process.env.NODE_ENV || 'development',
    gcpProject: process.env.GCP_PROJECT_ID,
  });
});

// ── Graceful Shutdown ───────────────────────────────────
setupGracefulShutdown(server, logger);

export default app;
