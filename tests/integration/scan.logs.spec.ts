import { orchestrateScan } from '../../src/services/workflowOrchestrator';

describe('Scan logging structure', () => {
  const logs: string[] = [];
  const originalLog = console.log;

  beforeAll(() => {
    console.log = (msg?: unknown) => {
      if (typeof msg === 'string') {
        logs.push(msg);
      }
    };
  });

  afterAll(() => {
    console.log = originalLog;
  });

  it('emits structured stage-scoped logs with codes/events', async () => {
    logs.length = 0;
    await orchestrateScan({
      localPath: __dirname,
      config: { downloaderEnabled: false }
    });
    const parsed = logs.map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean) as Array<Record<string, unknown>>;

    expect(parsed.length).toBeGreaterThanOrEqual(3);
    for (const entry of parsed) {
      expect(entry).toHaveProperty('stage');
      expect(entry).toHaveProperty('event');
      expect(entry).toHaveProperty('level');
      expect(entry).toHaveProperty('ts');
      expect(typeof entry.stage).toBe('string');
      expect(typeof entry.event).toBe('string');
    }
  });
});
