import { A2MeApiClient } from './client/a2me-api-client.js';
import { config } from './config.js';

/**
 * Argument autocompletion for tools that take a person by name/relationship
 * (find_family_member, get_message_context_for_person). As the user types, the MCP
 * client asks for completions and we offer the caller's own family members' names and
 * relationship labels — so "mo" suggests "mom"/"Monica", grounded in real family data.
 *
 * Uses the per-request user token (via the API client's requestContext), so it stays
 * scoped to the caller's family; returns [] on any error (completion is best-effort and
 * must never break the tool call). Read-only.
 */
export async function completePersonReference(value: string): Promise<string[]> {
  try {
    const client = new A2MeApiClient(config.a2meApiUrl, config.a2meAuthToken);
    // getFamilyMembers ignores the userId arg and scopes via the bearer token.
    const members = await client.getFamilyMembers('');

    const suggestions = new Set<string>();
    for (const m of members) {
      if (m.displayName) suggestions.add(m.displayName);
      if (m.relationshipLabel) suggestions.add(m.relationshipLabel);
    }

    const needle = value.trim().toLowerCase();
    const all = [...suggestions];
    const matched = needle ? all.filter((s) => s.toLowerCase().includes(needle)) : all;
    // MCP caps completion values at 100; keep it short and relevant.
    return matched.slice(0, 25);
  } catch {
    return [];
  }
}
