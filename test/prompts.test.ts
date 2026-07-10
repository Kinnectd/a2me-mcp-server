import { describe, it, expect } from 'vitest';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createServer, handle } from '../src/server.js';

async function connectedClient(): Promise<Client> {
  const server = createServer();
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  await server.connect(serverT);
  const client = new Client({ name: 'test', version: '0' });
  await client.connect(clientT);
  return client;
}

describe('MCP prompts', () => {
  it('exposes the family-context starting-point prompts', async () => {
    const client = await connectedClient();
    const { prompts } = await client.listPrompts();
    const names = prompts.map((p) => p.name);
    expect(names).toContain('write_birthday_card');
    expect(names).toContain('write_family_message');
    expect(names).toContain('family_catch_up');
    expect(names).toContain('upcoming_family_dates');
    expect(names).toContain('about_person');
  });

  it('interpolates the person argument into the prompt text', async () => {
    const client = await connectedClient();
    const res = await client.getPrompt({
      name: 'write_birthday_card',
      arguments: { person: 'my sister' },
    });
    const text = res.messages[0]?.content;
    expect(text).toMatchObject({ type: 'text' });
    expect((text as { text: string }).text).toContain('my sister');
    // Steers the assistant to the grounding tools.
    expect((text as { text: string }).text).toContain('get_birthday_card_context');
  });

  it('completes the person argument from the family roster', async () => {
    const client = await connectedClient();
    const res = await client.complete({
      ref: { type: 'ref/prompt', name: 'write_birthday_card' },
      argument: { name: 'person', value: 'm' },
    });
    const values = res.completion.values;
    expect(values.length).toBeGreaterThan(0);
    // Every suggestion should match what was typed…
    expect(values.every((v) => v.toLowerCase().includes('m'))).toBe(true);
    // …and include relationship labels and/or names from the mock family.
    expect(values).toContain('mother');
  });
});

describe('handle() graceful errors', () => {
  it('passes a successful result through unchanged', async () => {
    const ok = { content: [{ type: 'text' as const, text: 'ok' }], structuredContent: { a: 1 } };
    const res = await handle('thing', async () => ok);
    expect(res).toBe(ok);
  });

  it('converts a thrown error into a friendly isError result', async () => {
    const res = await handle('family members', async () => {
      throw new Error('A2Me API /me/v2/family failed: 500 Internal Server Error');
    });
    expect(res).toMatchObject({ isError: true });
    const text = (res as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("couldn't reach A2Me");
    expect(text).toContain('family members');
    // The raw technical detail must not leak to the user.
    expect(text).not.toContain('500');
  });
});
