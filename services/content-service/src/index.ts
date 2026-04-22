import express, { Application } from 'express';
import cors from 'cors';
import { timelineStages } from './data/timeline-stages.js';
import { glossaryTerms } from './data/glossary-terms.js';
import { successResponse, errorResponse, fuzzyMatch } from '@elect-ed/shared-utils';

const app: Application = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// ── Health Check ────────────────────────────
app.get('/health', (_req, res) => {
  res.json(successResponse({
    status: 'ok',
    service: 'content-service',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }));
});

// ── Timeline Stages ─────────────────────────
app.get('/api/stages', (_req, res) => {
  res.json(successResponse(timelineStages));
});

app.get('/api/stages/:id', (req, res) => {
  const stage = timelineStages.find(
    (s) => s.id === req.params.id || s.slug === req.params.id
  );

  if (!stage) {
    res.status(404).json(errorResponse('NOT_FOUND', `Stage "${req.params.id}" not found`));
    return;
  }

  res.json(successResponse(stage));
});

// ── Glossary ────────────────────────────────
app.get('/api/glossary', (req, res) => {
  const query = (req.query.q as string)?.trim();
  const category = req.query.category as string | undefined;

  let results = [...glossaryTerms];

  if (category) {
    results = results.filter((t) => t.category.toLowerCase() === category.toLowerCase());
  }

  if (query) {
    results = results.filter(
      (t) => fuzzyMatch(query, t.term) || fuzzyMatch(query, t.definition)
    );
  }

  // Sort alphabetically
  results.sort((a, b) => a.term.localeCompare(b.term));

  res.json(successResponse(results, { totalItems: results.length }));
});

app.get('/api/glossary/:slug', (req, res) => {
  const term = glossaryTerms.find((t) => t.slug === req.params.slug || t.id === req.params.slug);

  if (!term) {
    res.status(404).json(errorResponse('NOT_FOUND', `Term "${req.params.slug}" not found`));
    return;
  }

  // Resolve related terms
  const related = term.relatedTerms
    .map((slug) => glossaryTerms.find((t) => t.slug === slug || t.id === slug))
    .filter(Boolean);

  res.json(successResponse({ ...term, relatedTermsResolved: related }));
});

// ── Glossary Categories ─────────────────────
app.get('/api/glossary-categories', (_req, res) => {
  const categories = [...new Set(glossaryTerms.map((t) => t.category))].sort();
  res.json(successResponse(categories));
});

// ── Start Server ────────────────────────────
app.listen(PORT, () => {
  console.log(`📚 Content Service running on port ${PORT}`);
});

export default app;
