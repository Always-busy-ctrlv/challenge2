/**
 * ElectEd — Shared Firebase Tests
 */

import {
  initializeFirebaseAdmin,
  getFirestore,
  getAuth,
  createLogger,
  COLLECTIONS,
  _resetForTesting,
} from './index';

// Mock firebase-admin modules
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(() => ({ name: '[DEFAULT]' })),
  cert: jest.fn((path: string) => ({ projectId: 'test' })),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      limit: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ docs: [] })),
      })),
    })),
  })),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

jest.mock('@google-cloud/vertexai', () => ({
  VertexAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn(() => ({ generateContent: jest.fn() })),
  })),
}));

describe('shared-firebase', () => {
  beforeEach(() => {
    _resetForTesting();
    jest.clearAllMocks();
  });

  describe('COLLECTIONS', () => {
    it('exports correct collection names', () => {
      expect(COLLECTIONS.QUIZ_ATTEMPTS).toBe('quiz_attempts');
      expect(COLLECTIONS.USER_PROGRESS).toBe('user_progress');
      expect(COLLECTIONS.LEADERBOARD).toBe('leaderboard');
      expect(COLLECTIONS.CHAT_SESSIONS).toBe('chat_sessions');
    });
  });

  describe('initializeFirebaseAdmin', () => {
    it('initializes Firebase app', () => {
      const app = initializeFirebaseAdmin();
      expect(app).toBeDefined();
      expect(app.name).toBe('[DEFAULT]');
    });

    it('returns same instance on second call (singleton)', () => {
      const app1 = initializeFirebaseAdmin();
      const app2 = initializeFirebaseAdmin();
      expect(app1).toBe(app2);
    });
  });

  describe('getFirestore', () => {
    it('returns Firestore instance', () => {
      const db = getFirestore();
      expect(db).toBeDefined();
    });

    it('returns same instance (singleton)', () => {
      const db1 = getFirestore();
      const db2 = getFirestore();
      expect(db1).toBe(db2);
    });
  });

  describe('getAuth', () => {
    it('returns Auth instance', () => {
      const auth = getAuth();
      expect(auth).toBeDefined();
    });

    it('returns same instance (singleton)', () => {
      const auth1 = getAuth();
      const auth2 = getAuth();
      expect(auth1).toBe(auth2);
    });
  });

  describe('createLogger', () => {
    it('creates a logger for development', () => {
      const logger = createLogger('test-service');
      expect(logger).toBeDefined();
      expect(logger.level).toBe('info');
    });

    it('creates a logger for production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const logger = createLogger('test-service');
      expect(logger).toBeDefined();
      process.env.NODE_ENV = originalEnv;
    });

    it('respects LOG_LEVEL env var', () => {
      const originalLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'debug';
      const logger = createLogger('test-service');
      expect(logger.level).toBe('debug');
      process.env.LOG_LEVEL = originalLevel;
    });
  });

  describe('_resetForTesting', () => {
    it('resets all singletons', () => {
      initializeFirebaseAdmin();
      getFirestore();
      getAuth();
      _resetForTesting();
      // After reset, calling again should reinitialize
      const app = initializeFirebaseAdmin();
      expect(app).toBeDefined();
    });
  });
});
