"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const workflowOrchestrator_1 = require("../../src/services/workflowOrchestrator");
describe('Scan logging structure', () => {
    const logs = [];
    const originalLog = console.log;
    beforeAll(() => {
        console.log = (msg) => {
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
        await (0, workflowOrchestrator_1.orchestrateScan)({
            localPath: __dirname,
            config: { downloaderEnabled: false }
        });
        const parsed = logs.map((line) => {
            try {
                return JSON.parse(line);
            }
            catch {
                return null;
            }
        }).filter(Boolean);
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
