/**
 * ElectEd — Shared Firebase Tests
 * Coverage target: >99.5% on index.ts
 */

import {
  initializeFirebaseAdmin,
  getFirestore,
  getAuth,
  getVertexAIModel,
  isFirestoreAvailable,
  createLogger,
  _formatProductionLog,
  _formatDevelopmentLog,
  COLLECTIONS,
  _resetForTesting,
} from './index';

// Mock firebase-admin modules
const mockInitializeApp = jest.fn(() => ({ name: '[DEFAULT]' }));
const mockCert = jest.fn((path: string) => ({ projectId: 'test' }));
const mockGetApps = jest.fn(() => []);

jest.mock('firebase-admin/app', () => ({
  initializeApp: (...args: any[]) => mockInitializeApp(...args),
  cert: (...args: any[]) => mockCert(...args),
  getApps: (...args: any[]) => mockGetApps(...args),
}));

const mockFirestoreCollection = jest.fn(() => ({
  limit: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({ docs: [] })),
  })),
}));
const mockGetAdminFirestore = jest.fn(() => ({
  collection: mockFirestoreCollection,
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: (...args: any[]) => mockGetAdminFirestore(...args),
}));

const mockVerifyIdToken = jest.fn();
jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({ generateContent: mockGenerateContent }));
jest.mock('@google-cloud/vertexai', () => ({
  VertexAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

describe('shared-firebase', () => {
  beforeEach(() => {
    _resetForTesting();
    jest.clearAllMocks();
    mockGetApps.mockReturnValue([]);
  });

  // ── COLLECTIONS ────────────────────────────────
  describe('COLLECTIONS', () => {
    it('exports correct collection names', () => {
      expect(COLLECTIONS.QUIZ_ATTEMPTS).toBe('quiz_attempts');
      expect(COLLECTIONS.USER_PROGRESS).toBe('user_progress');
      expect(COLLECTIONS.LEADERBOARD).toBe('leaderboard');
      expect(COLLECTIONS.CHAT_SESSIONS).toBe('chat_sessions');
    });
  });

  // ── initializeFirebaseAdmin ────────────────────
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
      expect(mockInitializeApp).toHaveBeenCalledTimes(1);
    });

    it('returns existing app if one already exists', () => {
      const existingApp = { name: '[EXISTING]' };
      mockGetApps.mockReturnValue([existingApp]);

      const app = initializeFirebaseAdmin();
      expect(app).toBe(existingApp);
      expect(mockInitializeApp).not.toHaveBeenCalled();
    });

    it('uses service account key when GOOGLE_APPLICATION_CREDENTIALS is set', () => {
      const originalCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      process.env.GOOGLE_APPLICATION_CREDENTIALS = '/path/to/key.json';

      initializeFirebaseAdmin();

      expect(mockCert).toHaveBeenCalledWith('/path/to/key.json');
      expect(mockInitializeApp).toHaveBeenCalledWith(
        expect.objectContaining({ credential: expect.anything() }),
      );

      process.env.GOOGLE_APPLICATION_CREDENTIALS = originalCreds;
    });

    it('uses default credentials on Cloud Run (K_SERVICE set)', () => {
      const originalCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const originalKService = process.env.K_SERVICE;
      const originalProject = process.env.GCP_PROJECT_ID;
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      process.env.K_SERVICE = 'my-service';
      process.env.GCP_PROJECT_ID = 'test-cloud-project';

      initializeFirebaseAdmin();

      expect(mockCert).not.toHaveBeenCalled();
      expect(mockInitializeApp).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'test-cloud-project' }),
      );

      process.env.GOOGLE_APPLICATION_CREDENTIALS = originalCreds;
      process.env.K_SERVICE = originalKService;
      process.env.GCP_PROJECT_ID = originalProject;
    });

    it('uses default credentials in local development', () => {
      const originalCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const originalKService = process.env.K_SERVICE;
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      delete process.env.K_SERVICE;

      initializeFirebaseAdmin();

      expect(mockInitializeApp).toHaveBeenCalled();

      process.env.GOOGLE_APPLICATION_CREDENTIALS = originalCreds;
      process.env.K_SERVICE = originalKService;
    });

    it('falls back to demo project on initialization error', () => {
      const originalCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const originalProject = process.env.GCP_PROJECT_ID;
      process.env.GOOGLE_APPLICATION_CREDENTIALS = '/invalid/path.json';
      delete process.env.GCP_PROJECT_ID;

      // cert() throws inside the try block, triggering the catch fallback
      mockCert.mockImplementationOnce(() => { throw new Error('file not found'); });
      // First call (in try) will throw because cert failed before initializeApp runs
      // The catch block calls initializeApp again with fallback projectId
      mockInitializeApp.mockImplementationOnce(() => ({ name: '[FALLBACK]' }));

      const app = initializeFirebaseAdmin();
      expect(app).toBeDefined();
      expect(app.name).toBe('[FALLBACK]');
      // initializeApp called once in the catch block with demo project
      expect(mockInitializeApp).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 'demo-elect-ed' }),
      );

      process.env.GOOGLE_APPLICATION_CREDENTIALS = originalCreds;
      process.env.GCP_PROJECT_ID = originalProject;
    });
  });

  // ── getFirestore ──────────────────────────────
  describe('getFirestore', () => {
    it('returns Firestore instance', () => {
      const db = getFirestore();
      expect(db).toBeDefined();
    });

    it('returns same instance (singleton)', () => {
      const db1 = getFirestore();
      const db2 = getFirestore();
      expect(db1).toBe(db2);
      expect(mockGetAdminFirestore).toHaveBeenCalledTimes(1);
    });
  });

  // ── getAuth ───────────────────────────────────
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

  // ── getVertexAIModel ──────────────────────────
  describe('getVertexAIModel', () => {
    it('returns a GenerativeModel instance', () => {
      const model = getVertexAIModel();
      expect(model).toBeDefined();
      expect(model).toHaveProperty('generateContent');
    });

    it('returns same instance (singleton)', () => {
      const model1 = getVertexAIModel();
      const model2 = getVertexAIModel();
      expect(model1).toBe(model2);
      expect(mockGetGenerativeModel).toHaveBeenCalledTimes(1);
    });

    it('uses environment variables for config', () => {
      const originalProject = process.env.GCP_PROJECT_ID;
      const originalLocation = process.env.VERTEX_AI_LOCATION;
      const originalModel = process.env.VERTEX_AI_MODEL;

      process.env.GCP_PROJECT_ID = 'test-project';
      process.env.VERTEX_AI_LOCATION = 'europe-west1';
      process.env.VERTEX_AI_MODEL = 'gemini-pro';

      _resetForTesting();
      getVertexAIModel();

      const { VertexAI } = require('@google-cloud/vertexai');
      expect(VertexAI).toHaveBeenCalledWith({
        project: 'test-project',
        location: 'europe-west1',
      });
      expect(mockGetGenerativeModel).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gemini-pro' }),
      );

      process.env.GCP_PROJECT_ID = originalProject;
      process.env.VERTEX_AI_LOCATION = originalLocation;
      process.env.VERTEX_AI_MODEL = originalModel;
    });

    it('uses default values when env vars not set', () => {
      const originalProject = process.env.GCP_PROJECT_ID;
      const originalCloud = process.env.GOOGLE_CLOUD_PROJECT;
      const originalLocation = process.env.VERTEX_AI_LOCATION;
      const originalModel = process.env.VERTEX_AI_MODEL;

      delete process.env.GCP_PROJECT_ID;
      delete process.env.GOOGLE_CLOUD_PROJECT;
      delete process.env.VERTEX_AI_LOCATION;
      delete process.env.VERTEX_AI_MODEL;

      _resetForTesting();
      getVertexAIModel();

      const { VertexAI } = require('@google-cloud/vertexai');
      expect(VertexAI).toHaveBeenCalledWith({
        project: 'demo-elect-ed',
        location: 'us-central1',
      });
      expect(mockGetGenerativeModel).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gemini-2.0-flash' }),
      );

      process.env.GCP_PROJECT_ID = originalProject;
      process.env.GOOGLE_CLOUD_PROJECT = originalCloud;
      process.env.VERTEX_AI_LOCATION = originalLocation;
      process.env.VERTEX_AI_MODEL = originalModel;
    });

    it('configures generationConfig correctly', () => {
      _resetForTesting();
      getVertexAIModel();

      expect(mockGetGenerativeModel).toHaveBeenCalledWith(
        expect.objectContaining({
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.3,
            topP: 0.8,
          },
        }),
      );
    });

    it('includes system instruction', () => {
      _resetForTesting();
      getVertexAIModel();

      expect(mockGetGenerativeModel).toHaveBeenCalledWith(
        expect.objectContaining({
          systemInstruction: expect.objectContaining({
            role: 'system',
            parts: expect.arrayContaining([
              expect.objectContaining({
                text: expect.stringContaining('ElectEd AI'),
              }),
            ]),
          }),
        }),
      );
    });
  });

  // ── isFirestoreAvailable ──────────────────────
  describe('isFirestoreAvailable', () => {
    it('returns true when Firestore is reachable', async () => {
      const result = await isFirestoreAvailable();
      expect(result).toBe(true);
    });

    it('returns false when Firestore throws', async () => {
      mockFirestoreCollection.mockImplementationOnce(() => ({
        limit: jest.fn(() => ({
          get: jest.fn(() => Promise.reject(new Error('connection refused'))),
        })),
      }));

      // Reset to clear cached firestore instance
      _resetForTesting();
      const result = await isFirestoreAvailable();
      expect(result).toBe(false);
    });
  });

  // ── createLogger ──────────────────────────────
  describe('createLogger', () => {
    it('creates a logger for development', () => {
      const origEnv = process.env.NODE_ENV;
      const origK = process.env.K_SERVICE;
      delete process.env.K_SERVICE;
      process.env.NODE_ENV = 'development';

      const logger = createLogger('test-service');
      expect(logger).toBeDefined();
      expect(logger.level).toBe('info');

      process.env.NODE_ENV = origEnv;
      if (origK !== undefined) process.env.K_SERVICE = origK;
    });

    it('dev logger exercises format pipeline', () => {
      const origEnv = process.env.NODE_ENV;
      const origK = process.env.K_SERVICE;
      delete process.env.K_SERVICE;
      process.env.NODE_ENV = 'development';

      const logger = createLogger('dev-svc');
      const transport = logger.transports[0] as any;
      const format = transport.format;
      if (format && format.transform) {
        const result = format.transform({
          level: 'info',
          message: 'test-dev-msg',
          [Symbol.for('level')]: 'info',
        });
        expect(result).toBeDefined();
        const msg = result[Symbol.for('message')];
        expect(msg).toContain('dev-svc');
        expect(msg).toContain('test-dev-msg');
      }

      process.env.NODE_ENV = origEnv;
      if (origK !== undefined) process.env.K_SERVICE = origK;
    });

    it('dev logger format pipeline handles metadata', () => {
      const origEnv = process.env.NODE_ENV;
      const origK = process.env.K_SERVICE;
      delete process.env.K_SERVICE;
      process.env.NODE_ENV = 'development';

      const logger = createLogger('dev-meta');
      const transport = logger.transports[0] as any;
      const format = transport.format;
      if (format && format.transform) {
        const result = format.transform({
          level: 'warn',
          message: 'meta-msg',
          extra: 'data',
          [Symbol.for('level')]: 'warn',
        });
        expect(result).toBeDefined();
        const msg = result[Symbol.for('message')];
        expect(msg).toContain('meta-msg');
      }

      process.env.NODE_ENV = origEnv;
      if (origK !== undefined) process.env.K_SERVICE = origK;
    });

    it('creates a logger for production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const logger = createLogger('test-service');
      expect(logger).toBeDefined();
      process.env.NODE_ENV = originalEnv;
    });

    it('prod logger writes structured JSON with severity', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const logger = createLogger('test-prod');
      const chunks: string[] = [];
      const transport = logger.transports[0] as any;
      transport.log = (info: any, callback: any) => {
        chunks.push(info[Symbol.for('message')] || JSON.stringify(info));
        callback();
      };

      logger.info('prod-test-msg');
      expect(chunks.length).toBeGreaterThan(0);
      // Prod format produces JSON with severity
      const parsed = JSON.parse(chunks[0]);
      expect(parsed.severity).toBe('INFO');
      expect(parsed.message).toBe('prod-test-msg');
      process.env.NODE_ENV = originalEnv;
    });

    it('prod logger maps error level to ERROR severity', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const logger = createLogger('severity-test');
      const chunks: string[] = [];
      const transport = logger.transports[0] as any;
      transport.log = (info: any, callback: any) => {
        chunks.push(info[Symbol.for('message')] || JSON.stringify(info));
        callback();
      };

      logger.error('error-msg');
      const parsed = JSON.parse(chunks[0]);
      expect(parsed.severity).toBe('ERROR');
      process.env.NODE_ENV = originalEnv;
    });

    it('prod logger includes traceId and service labels', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const logger = createLogger('trace-service');
      const chunks: string[] = [];
      const transport = logger.transports[0] as any;
      transport.log = (info: any, callback: any) => {
        chunks.push(info[Symbol.for('message')] || JSON.stringify(info));
        callback();
      };

      logger.info('trace-msg', { traceId: 'abc123' });
      const parsed = JSON.parse(chunks[0]);
      expect(parsed['logging.googleapis.com/trace']).toBe('abc123');
      expect(parsed['logging.googleapis.com/labels'].service).toBe('trace-service');
      process.env.NODE_ENV = originalEnv;
    });

    it('prod logger falls back to DEFAULT severity for unknown levels', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const logger = createLogger('default-sev');
      logger.level = 'silly';
      const chunks: string[] = [];
      const transport = logger.transports[0] as any;
      transport.log = (info: any, callback: any) => {
        chunks.push(info[Symbol.for('message')] || JSON.stringify(info));
        callback();
      };

      logger.log('silly', 'silly-msg');
      const parsed = JSON.parse(chunks[0]);
      expect(parsed.severity).toBe('DEFAULT');
      process.env.NODE_ENV = originalEnv;
    });

    it('creates logger for K_SERVICE environment', () => {
      const originalKService = process.env.K_SERVICE;
      const originalEnv = process.env.NODE_ENV;
      process.env.K_SERVICE = 'my-service';
      process.env.NODE_ENV = 'development'; // Should still use prod format due to K_SERVICE

      const logger = createLogger('test-service');
      expect(logger).toBeDefined();

      process.env.K_SERVICE = originalKService;
      process.env.NODE_ENV = originalEnv;
    });

    it('respects LOG_LEVEL env var', () => {
      const originalLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'debug';
      const logger = createLogger('test-service');
      expect(logger.level).toBe('debug');
      process.env.LOG_LEVEL = originalLevel;
    });

    it('defaults to info log level', () => {
      const originalLevel = process.env.LOG_LEVEL;
      delete process.env.LOG_LEVEL;
      const logger = createLogger('test-service');
      expect(logger.level).toBe('info');
      process.env.LOG_LEVEL = originalLevel;
    });
  });

  // ── _formatProductionLog ──────────────────────
  describe('_formatProductionLog', () => {
    it('maps info level to INFO severity', () => {
      const result = _formatProductionLog('my-svc', {
        timestamp: '2024-01-01T00:00:00Z',
        level: 'info',
        message: 'test',
      });
      const parsed = JSON.parse(result);
      expect(parsed.severity).toBe('INFO');
      expect(parsed.message).toBe('test');
      expect(parsed['logging.googleapis.com/labels'].service).toBe('my-svc');
    });

    it('maps error level to ERROR severity', () => {
      const result = _formatProductionLog('svc', {
        timestamp: 't', level: 'error', message: 'err',
      });
      expect(JSON.parse(result).severity).toBe('ERROR');
    });

    it('maps warn level to WARNING severity', () => {
      const result = _formatProductionLog('svc', {
        timestamp: 't', level: 'warn', message: 'w',
      });
      expect(JSON.parse(result).severity).toBe('WARNING');
    });

    it('maps debug level to DEBUG severity', () => {
      const result = _formatProductionLog('svc', {
        timestamp: 't', level: 'debug', message: 'd',
      });
      expect(JSON.parse(result).severity).toBe('DEBUG');
    });

    it('falls back to DEFAULT for unknown levels', () => {
      const result = _formatProductionLog('svc', {
        timestamp: 't', level: 'silly', message: 's',
      });
      expect(JSON.parse(result).severity).toBe('DEFAULT');
    });

    it('includes traceId when provided', () => {
      const result = _formatProductionLog('svc', {
        timestamp: 't', level: 'info', message: 'm',
        traceId: 'trace-abc',
      });
      expect(JSON.parse(result)['logging.googleapis.com/trace']).toBe('trace-abc');
    });

    it('sets trace to undefined when no traceId', () => {
      const result = _formatProductionLog('svc', {
        timestamp: 't', level: 'info', message: 'm',
      });
      expect(JSON.parse(result)['logging.googleapis.com/trace']).toBeUndefined();
    });

    it('spreads extra metadata into output', () => {
      const result = _formatProductionLog('svc', {
        timestamp: 't', level: 'info', message: 'm',
        customKey: 'customVal',
      });
      expect(JSON.parse(result).customKey).toBe('customVal');
    });
  });

  // ── _formatDevelopmentLog ─────────────────────
  describe('_formatDevelopmentLog', () => {
    it('formats a basic log line with service name', () => {
      const result = _formatDevelopmentLog('my-svc', {
        timestamp: '12:00:00',
        level: 'info',
        message: 'hello',
      });
      expect(result).toBe('12:00:00 [my-svc] info: hello');
    });

    it('includes JSON metadata when present', () => {
      const result = _formatDevelopmentLog('svc', {
        timestamp: '12:00:00',
        level: 'warn',
        message: 'test',
        key: 'value',
      });
      expect(result).toContain('[svc]');
      expect(result).toContain('test');
      expect(result).toContain('"key":"value"');
    });

    it('omits metadata string when no extra fields', () => {
      const result = _formatDevelopmentLog('svc', {
        timestamp: '12:00:00',
        level: 'info',
        message: 'clean',
      });
      expect(result).toBe('12:00:00 [svc] info: clean');
      expect(result).not.toContain('{');
    });
  });

  // ── _resetForTesting ──────────────────────────
  describe('_resetForTesting', () => {
    it('resets all singletons', () => {
      initializeFirebaseAdmin();
      getFirestore();
      getAuth();
      getVertexAIModel();
      _resetForTesting();

      // After reset, calling again should reinitialize
      jest.clearAllMocks();
      mockGetApps.mockReturnValue([]);
      const app = initializeFirebaseAdmin();
      expect(app).toBeDefined();
      expect(mockInitializeApp).toHaveBeenCalledTimes(1);
    });
  });
});
