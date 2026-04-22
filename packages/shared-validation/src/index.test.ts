import {
  quizAnswerSchema,
  quizSubmissionSchema,
  chatMessageSchema,
  startSessionSchema,
  glossarySearchSchema,
  subscribeReminderSchema,
  paginationSchema,
  regionSchema,
} from './index';

describe('shared-validation', () => {
  describe('quizAnswerSchema', () => {
    it('validates correct quiz answer', () => {
      const valid = { questionId: 'q1', selectedIndex: 0 };
      expect(quizAnswerSchema.parse(valid)).toEqual(valid);
    });

    it('fails on invalid index', () => {
      expect(() => quizAnswerSchema.parse({ questionId: 'q1', selectedIndex: -1 })).toThrow();
      expect(() => quizAnswerSchema.parse({ questionId: 'q1', selectedIndex: 10 })).toThrow();
    });

    it('fails on empty questionId', () => {
      expect(() => quizAnswerSchema.parse({ questionId: '', selectedIndex: 1 })).toThrow();
    });
  });

  describe('quizSubmissionSchema', () => {
    it('validates valid submission', () => {
      const valid = {
        stageId: 's1',
        answers: [{ questionId: 'q1', selectedIndex: 1 }],
      };
      expect(quizSubmissionSchema.parse(valid)).toEqual(valid);
    });

    it('fails on empty answers array', () => {
      expect(() => quizSubmissionSchema.parse({ stageId: 's1', answers: [] })).toThrow();
    });
  });

  describe('chatMessageSchema', () => {
    it('validates valid chat message', () => {
      const valid = { sessionId: 's1', message: 'hello' };
      expect(chatMessageSchema.parse(valid)).toEqual(valid);
    });

    it('fails on message too long', () => {
      const longMessage = 'a'.repeat(2001);
      expect(() => chatMessageSchema.parse({ sessionId: 's1', message: longMessage })).toThrow();
    });
  });

  describe('startSessionSchema', () => {
    it('validates session start', () => {
      expect(startSessionSchema.parse({})).toEqual({});
      expect(startSessionSchema.parse({ userId: 'u1' })).toEqual({ userId: 'u1' });
    });
  });

  describe('glossarySearchSchema', () => {
    it('validates search query', () => {
      expect(glossarySearchSchema.parse({ q: 'vote' })).toEqual({ q: 'vote' });
    });

    it('fails on empty query', () => {
      expect(() => glossarySearchSchema.parse({ q: '' })).toThrow();
    });
  });

  describe('subscribeReminderSchema', () => {
    it('validates reminder subscription', () => {
      const valid = { userId: 'u1', eventId: 'e1', method: 'push' };
      expect(subscribeReminderSchema.parse(valid)).toEqual(valid);
    });

    it('uses default method', () => {
      const input = { userId: 'u1', eventId: 'e1' };
      expect(subscribeReminderSchema.parse(input)).toEqual({ ...input, method: 'email' });
    });
  });

  describe('paginationSchema', () => {
    it('validates pagination params', () => {
      expect(paginationSchema.parse({ page: 2, limit: 10 })).toEqual({ page: 2, limit: 10 });
    });

    it('uses defaults and coerces strings', () => {
      expect(paginationSchema.parse({})).toEqual({ page: 1, limit: 20 });
      expect(paginationSchema.parse({ page: '5', limit: '50' })).toEqual({ page: 5, limit: 50 });
    });
  });

  describe('regionSchema', () => {
    it('validates region', () => {
      expect(regionSchema.parse({ region: 'tx' })).toEqual({ region: 'tx' });
      expect(regionSchema.parse({})).toEqual({ region: 'federal' });
    });
  });
});
