import {
  extractContactFromSubmission,
  normalizeEmail,
  normalizePhone,
} from '../utils/contactFromSubmission';

describe('contactFromSubmission utils', () => {
  describe('normalizeEmail', () => {
    it('trims and lowercases', () => {
      expect(normalizeEmail('  Jane@EXAMPLE.COM  ')).toBe('jane@example.com');
    });
  });

  describe('normalizePhone', () => {
    it('trims and collapses internal whitespace', () => {
      expect(normalizePhone('  +1  234  567  ')).toBe('+1 234 567');
    });
  });

  describe('extractContactFromSubmission', () => {
    it('returns null when no email or phone', () => {
      expect(
        extractContactFromSubmission(
          [
            { name: 'comment', type: 'text' },
            { name: 'rating', type: 'radio' },
          ],
          { comment: 'Hi', rating: '5' },
        ),
      ).toBeNull();
    });

    it('extracts from typed email and name fields', () => {
      const r = extractContactFromSubmission(
        [
          { name: 'full_name', type: 'name' },
          { name: 'user_email', type: 'email' },
        ],
        { full_name: 'Jane Doe', user_email: 'Jane@Example.com' },
      );
      expect(r).toEqual({
        email: 'jane@example.com',
        displayName: 'Jane Doe',
      });
    });

    it('uses first email-typed field when multiple exist', () => {
      const r = extractContactFromSubmission(
        [
          { name: 'primary', type: 'email' },
          { name: 'backup', type: 'email' },
        ],
        { primary: 'a@a.com', backup: 'b@b.com' },
      );
      expect(r?.email).toBe('a@a.com');
    });

    it('falls back to field named email with non-email type', () => {
      const r = extractContactFromSubmission([{ name: 'email', type: 'text' }], { email: 'x@y.co' });
      expect(r).toEqual({ email: 'x@y.co' });
    });

    it('extracts phone from type phone', () => {
      const r = extractContactFromSubmission([{ name: 'cell', type: 'phone' }], { cell: ' +977 981 ' });
      expect(r).toEqual({ phone: '+977 981' });
    });

    it('falls back to mobile field name', () => {
      const r = extractContactFromSubmission([{ name: 'mobile', type: 'text' }], { mobile: '111' });
      expect(r).toEqual({ phone: '111' });
    });

    it('returns phone-only contact without displayName when name missing', () => {
      const r = extractContactFromSubmission([{ name: 'tel', type: 'phone' }], { tel: '999' });
      expect(r).toEqual({ phone: '999' });
    });

    it('includes email phone and name when all present', () => {
      const r = extractContactFromSubmission(
        [
          { name: 'name', type: 'name' },
          { name: 'email', type: 'email' },
          { name: 'phone', type: 'phone' },
        ],
        { name: 'A', email: 'a@b.c', phone: '1' },
      );
      expect(r).toEqual({ displayName: 'A', email: 'a@b.c', phone: '1' });
    });

    it('ignores checkbox array responses for identity', () => {
      const r = extractContactFromSubmission(
        [{ name: 'email', type: 'email' }],
        { email: ['a@b.com'] as unknown as string },
      );
      expect(r).toBeNull();
    });
  });
});
