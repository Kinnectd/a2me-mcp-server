import { describe, it, expect } from 'vitest';
import {
  resolvePersonReference,
  resolveRelationshipReference,
  resolvePersonByName,
  getSafeMemoryContext,
  getMessageContext,
} from '../../src/resolver/family-context-resolver.js';

describe('family-context-resolver', () => {
  const userId = 'user-001';

  // Live family labels come back title-cased ("Parent", "Mother"); matching must still work.
  describe('title-cased (live) relationship labels', () => {
    const liveFamily = [
      { personId: 'p1', displayName: 'Linda Doe', relationshipLabel: 'Mother' },
      { personId: 'p2', displayName: 'Robert Doe', relationshipLabel: 'Father' },
    ];

    it('matches an alias ("mom") against a title-cased label', () => {
      const result = resolvePersonReference(userId, 'mom', liveFamily);
      expect(result.matches[0]?.displayName).toBe('Linda Doe');
      expect(result.matches[0]?.relationshipLabel).toBe('Mother'); // original label preserved
    });

    it('matches the relationship word ("father") against a title-cased label', () => {
      const result = resolvePersonReference(userId, 'father', liveFamily);
      expect(result.matches[0]?.displayName).toBe('Robert Doe');
    });

    it('resolveRelationshipReference matches a title-cased label via alias', () => {
      const result = resolveRelationshipReference(userId, 'dad', liveFamily);
      expect(result.matches[0]?.displayName).toBe('Robert Doe');
    });
  });

  describe('resolvePersonReference', () => {
    it('resolves by exact first name', () => {
      const result = resolvePersonReference(userId, 'Sarah');
      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.matches[0].displayName).toBe('Sarah Walker');
      expect(result.matches[0].confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('resolves by relationship label', () => {
      const result = resolvePersonReference(userId, 'grandmother');
      expect(result.matches.length).toBe(1);
      expect(result.matches[0].displayName).toBe('Margaret Walker');
    });

    it('resolves "my grandmother" alias', () => {
      const result = resolvePersonReference(userId, 'my grandmother');
      expect(result.matches.length).toBe(1);
      expect(result.matches[0].displayName).toBe('Margaret Walker');
    });

    it('resolves "mom" alias', () => {
      const result = resolvePersonReference(userId, 'mom');
      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.matches[0].displayName).toBe('Linda Walker');
    });

    it('resolves "dad" alias', () => {
      const result = resolvePersonReference(userId, 'dad');
      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.matches[0].displayName).toBe('Robert Walker');
    });

    it('returns empty for nonsense query', () => {
      const result = resolvePersonReference(userId, 'xyznonexistent123');
      expect(result.matches.length).toBe(0);
      expect(result.suggestion).toBeDefined();
    });

    it('marks ambiguous when multiple partial matches', () => {
      const result = resolvePersonReference(userId, 'Walker');
      expect(result.matches.length).toBeGreaterThan(1);
      expect(result.ambiguous).toBe(true);
    });
  });

  describe('resolveRelationshipReference', () => {
    it('resolves direct relationship label', () => {
      const result = resolveRelationshipReference(userId, 'mother');
      expect(result.matches.length).toBe(1);
      expect(result.matches[0].displayName).toBe('Linda Walker');
    });

    it('resolves alias "grandma"', () => {
      const result = resolveRelationshipReference(userId, 'grandma');
      expect(result.matches.length).toBe(1);
      expect(result.matches[0].displayName).toBe('Margaret Walker');
    });

    it('returns empty for unknown relationship', () => {
      const result = resolveRelationshipReference(userId, 'nephew');
      expect(result.matches.length).toBe(0);
    });
  });

  describe('resolvePersonByName', () => {
    it('resolves exact full name', () => {
      const result = resolvePersonByName(userId, 'Linda Walker');
      expect(result.matches.length).toBe(1);
      expect(result.matches[0].confidence).toBe(1.0);
    });

    it('resolves first name only', () => {
      const result = resolvePersonByName(userId, 'Jordan');
      expect(result.matches.length).toBe(1);
      expect(result.matches[0].displayName).toBe('Jordan Rivera');
    });

    it('handles no match gracefully', () => {
      const result = resolvePersonByName(userId, 'Unknown Person');
      expect(result.matches.length).toBe(0);
    });
  });

  describe('getSafeMemoryContext', () => {
    it('returns interests and bio for known person', () => {
      const context = getSafeMemoryContext(userId, 'person-005');
      expect(context.length).toBeGreaterThan(0);
      expect(context.some((c) => c.includes('painting'))).toBe(true);
    });

    it('does not contain private data', () => {
      const context = getSafeMemoryContext(userId, 'person-005');
      const text = context.join(' ');
      expect(text).not.toContain('@');
      expect(text).not.toContain('phone');
      expect(text).not.toContain('address');
    });

    it('returns empty for unknown person', () => {
      const context = getSafeMemoryContext(userId, 'nonexistent');
      expect(context.length).toBe(0);
    });
  });

  describe('getMessageContext', () => {
    it('returns full message context for valid person', () => {
      const ctx = getMessageContext(userId, 'Sarah', 'birthday', 'warm');
      expect(ctx).not.toBeNull();
      expect(ctx!.resolvedPerson.displayName).toBe('Sarah Walker');
      expect(ctx!.occasion).toBe('birthday');
      expect(ctx!.privacyNotes.length).toBeGreaterThan(0);
    });

    it('returns null for unknown person', () => {
      const ctx = getMessageContext(userId, 'xyznonexistent');
      expect(ctx).toBeNull();
    });
  });
});
