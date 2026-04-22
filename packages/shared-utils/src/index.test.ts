import {
  generateId,
  slugify,
  truncate,
  calculateScore,
  formatDate,
  daysUntil,
  debounce,
  clamp,
  fuzzyMatch,
  successResponse,
  errorResponse,
} from './index';

describe('shared-utils', () => {
  describe('generateId', () => {
    it('generates a unique ID', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).toBeDefined();
      expect(typeof id1).toBe('string');
      expect(id1).not.toEqual(id2);
    });

    it('uses fallback when crypto is undefined', () => {
      const originalCrypto = global.crypto;
      // @ts-ignore
      delete global.crypto;
      const id = generateId();
      expect(id).toMatch(/^[0-9a-f-]+$/);
      global.crypto = originalCrypto;
    });
  });

  describe('slugify', () => {
    it('converts strings to URL safe slugs', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Voter Registration 2026!')).toBe('voter-registration-2026');
      expect(slugify('  Trim  Spaces  ')).toBe('trim-spaces');
      expect(slugify('special_chars_and spaces')).toBe('special-chars-and-spaces');
    });
  });

  describe('truncate', () => {
    it('truncates long strings', () => {
      expect(truncate('Hello World', 11)).toBe('Hello World');
      expect(truncate('Hello World', 8)).toBe('Hello...');
    });
  });

  describe('calculateScore', () => {
    it('calculates percentage correctly', () => {
      expect(calculateScore(4, 5)).toBe(80);
      expect(calculateScore(1, 3)).toBe(33);
      expect(calculateScore(0, 0)).toBe(0);
    });
  });

  describe('formatDate', () => {
    it('formats dates correctly', () => {
      const date = new Date('2026-04-21');
      expect(formatDate(date)).toMatch(/April 21, 2026/);
      expect(formatDate('2026-04-21')).toMatch(/April 21, 2026/);
    });
  });

  describe('daysUntil', () => {
    it('calculates days correctly', () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      expect(daysUntil(future)).toBe(5);

      const past = new Date();
      past.setDate(past.getDate() - 5);
      expect(daysUntil(past)).toBe(0);
    });

    it('works with string input', () => {
      const future = new Date();
      future.setDate(future.getDate() + 10);
      expect(daysUntil(future.toISOString())).toBe(10);
    });
  });

  describe('debounce', () => {
    it('debounces function calls', (done) => {
      const mockFn = jest.fn();
      const debounced = debounce(mockFn, 50);

      debounced();
      debounced();
      debounced();

      expect(mockFn).not.toHaveBeenCalled();

      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        done();
      }, 100);
    });
  });

  describe('clamp', () => {
    it('clamps values correctly', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('fuzzyMatch', () => {
    it('matches strings fuzzily', () => {
      expect(fuzzyMatch('vtr', 'voter')).toBe(true);
      expect(fuzzyMatch('abc', 'axbycz')).toBe(true);
      expect(fuzzyMatch('xyz', 'abc')).toBe(false);
      expect(fuzzyMatch('voter', 'Voter Registration')).toBe(true);
    });
  });

  describe('response helpers', () => {
    it('creates success response', () => {
      const data = { foo: 'bar' };
      expect(successResponse(data)).toEqual({
        success: true,
        data,
      });
      expect(successResponse(data, { page: 1 })).toEqual({
        success: true,
        data,
        meta: { page: 1 },
      });
    });

    it('creates error response', () => {
      expect(errorResponse('NOT_FOUND', 'Not found')).toEqual({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Not found' },
      });
      expect(errorResponse('VALIDATION', 'Invalid', { field: 'email' })).toEqual({
        success: false,
        error: { code: 'VALIDATION', message: 'Invalid', details: { field: 'email' } },
      });
    });
  });
});
