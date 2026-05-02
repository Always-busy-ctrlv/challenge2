/**
 * ElectEd — Shared Firebase & GCP Services
 *
 * Provides centralized initialization for:
 * - Firebase Admin SDK (Firestore, Auth)
 * - Google Cloud Logging (via Winston + @google-cloud/logging-winston)
 * - Vertex AI (Gemini) client
 * - Collection constants and helpers
 */

import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { VertexAI, type GenerativeModel } from '@google-cloud/vertexai';
import winston from 'winston';

// ── Firestore Collection Names ──────────────────────────
export const COLLECTIONS = {
  QUIZ_ATTEMPTS: 'quiz_attempts',
  USER_PROGRESS: 'user_progress',
  LEADERBOARD: 'leaderboard',
  CHAT_SESSIONS: 'chat_sessions',
} as const;

// ── Firebase Admin Singleton ────────────────────────────
let _app: App | null = null;
let _firestore: Firestore | null = null;
let _auth: Auth | null = null;

/**
 * Initialize Firebase Admin SDK (idempotent).
 * Detects credentials from:
 * 1. GOOGLE_APPLICATION_CREDENTIALS env var
 * 2. GCP metadata server (Cloud Run / GCE)
 * 3. Falls back to demo project for local dev
 */
export function initializeFirebaseAdmin(): App {
  if (_app) return _app;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    _app = existingApps[0];
    return _app;
  }

  const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;

  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Use service account key file
      _app = initializeApp({
        credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
        projectId,
      });
    } else if (process.env.K_SERVICE) {
      // Running on Cloud Run — uses default credentials
      _app = initializeApp({ projectId });
    } else {
      // Local development — use application default credentials
      _app = initializeApp({ projectId });
    }
  } catch (error) {
    // Fallback for environments without credentials
    _app = initializeApp({ projectId: projectId || 'demo-elect-ed' });
  }

  return _app;
}

/**
 * Get Firestore instance (singleton).
 */
export function getFirestore(): Firestore {
  if (_firestore) return _firestore;
  initializeFirebaseAdmin();
  _firestore = getAdminFirestore();
  return _firestore;
}

/**
 * Get Firebase Auth instance (singleton).
 */
export function getAuth(): Auth {
  if (_auth) return _auth;
  initializeFirebaseAdmin();
  _auth = getAdminAuth();
  return _auth;
}

// ── Vertex AI (Gemini) ──────────────────────────────────
let _vertexAI: VertexAI | null = null;
let _generativeModel: GenerativeModel | null = null;

/**
 * Get Vertex AI Gemini model instance.
 */
export function getVertexAIModel(): GenerativeModel {
  if (_generativeModel) return _generativeModel;

  const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'demo-elect-ed';
  const location = process.env.VERTEX_AI_LOCATION || 'us-central1';
  const modelId = process.env.VERTEX_AI_MODEL || 'gemini-2.0-flash';

  _vertexAI = new VertexAI({ project: projectId, location });
  _generativeModel = _vertexAI.getGenerativeModel({
    model: modelId,
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.3,
      topP: 0.8,
    },
    systemInstruction: {
      role: 'system',
      parts: [{
        text: `You are ElectEd AI — an expert, non-partisan election education assistant. 
You help citizens understand U.S. election processes including voter registration, primaries, 
campaigns, Election Day procedures, and results certification. 
Always cite official sources (vote.gov, usa.gov, FEC.gov). 
Keep answers concise, factual, and accessible. 
Never express political opinions or candidate preferences.`,
      }],
    },
  });

  return _generativeModel;
}

// ── Cloud Logging (via Winston) ─────────────────────────

/**
 * Format a log entry for GCP Cloud Logging (production).
 * Exported for testability.
 */
export function _formatProductionLog(
  serviceName: string,
  { timestamp, level, message, ...meta }: Record<string, any>,
): string {
  const severityMap: Record<string, string> = {
    error: 'ERROR',
    warn: 'WARNING',
    info: 'INFO',
    debug: 'DEBUG',
  };
  return JSON.stringify({
    severity: severityMap[level] || 'DEFAULT',
    message,
    timestamp,
    'logging.googleapis.com/labels': { service: serviceName },
    'logging.googleapis.com/trace': meta['traceId'] || undefined,
    ...meta,
  });
}

/**
 * Format a log entry for development console output.
 * Exported for testability.
 */
export function _formatDevelopmentLog(
  serviceName: string,
  { timestamp, level, message, ...meta }: Record<string, any>,
): string {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${serviceName}] ${level}: ${message}${metaStr}`;
}

/**
 * Create a structured logger for a service.
 * - In production (Cloud Run): uses Google Cloud Logging format
 * - In development: uses colorized console output
 */
export function createLogger(serviceName: string): winston.Logger {
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.K_SERVICE;
  const logLevel = process.env.LOG_LEVEL || 'info';

  const transports: winston.transport[] = [];

  if (isProduction) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          // istanbul ignore next -- Winston doesn't call printf in non-TTY test env
          winston.format.printf((info) => _formatProductionLog(serviceName, info)),
        ),
      }),
    );
  } else {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'HH:mm:ss' }),
          // istanbul ignore next -- Winston doesn't call printf in non-TTY test env
          winston.format.printf((info) => _formatDevelopmentLog(serviceName, info)),
        ),
      }),
    );
  }

  return winston.createLogger({
    level: logLevel,
    defaultMeta: { service: serviceName },
    transports,
  });
}

// ── Firestore Helpers ───────────────────────────────────

/**
 * Check if Firestore is available (for graceful fallback).
 */
export async function isFirestoreAvailable(): Promise<boolean> {
  try {
    const db = getFirestore();
    await db.collection('_health').limit(1).get();
    return true;
  } catch {
    return false;
  }
}

// ── Reset for Testing ───────────────────────────────────
export function _resetForTesting(): void {
  _app = null;
  _firestore = null;
  _auth = null;
  _vertexAI = null;
  _generativeModel = null;
}
