import type { A2MeApiClient } from '../client/a2me-api-client.js';
import { resolvePersonReference } from '../resolver/family-context-resolver.js';

/**
 * Shared person-name resolution for the tools that take a fuzzy `personName` input
 * (life story, story questions, wishlist, memory search). Accepts "me"/"myself" for the
 * authenticated user; everything else is fuzzy-matched over the caller's family via the
 * family-context resolver. Returns a friendly message instead of a match when the name is
 * unknown or ambiguous, so tools can surface it directly.
 */

const SELF_REFERENCES = new Set(['me', 'myself', 'i', 'self']);

export type ResolvePersonOutcome =
  | { ok: true; personId: string; displayName: string }
  | { ok: false; message: string };

export async function resolvePersonInput(
  client: A2MeApiClient,
  authUserId: string,
  personName: string,
): Promise<ResolvePersonOutcome> {
  if (SELF_REFERENCES.has(personName.trim().toLowerCase())) {
    const me = await client.getMe();
    return { ok: true, personId: me.id, displayName: me.displayName };
  }

  const family = await client.getFamilyMembersDetailed(authUserId);
  const result = resolvePersonReference(authUserId, personName, family);
  if (result.matches.length === 0) {
    return { ok: false, message: `No family member found matching "${personName}".` };
  }
  if (result.ambiguous) {
    return {
      ok: false,
      message:
        result.suggestion ??
        `Multiple family members match "${personName}" — please be more specific.`,
    };
  }
  const top = result.matches[0];
  return { ok: true, personId: top.personId, displayName: top.displayName };
}
