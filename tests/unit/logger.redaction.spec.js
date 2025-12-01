"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../../src/lib/logger");
describe('logger redaction and metrics', () => {
    const logs = [];
    const originalLog = console.log;
    beforeAll(() => {
        console.log = (msg) => {
            if (typeof msg === 'string')
                logs.push(msg);
        };
    });
    afterAll(() => {
        console.log = originalLog;
    });
    it('redacts secrets in messages', () => {
        logs.length = 0;
        const logger = (0, logger_1.createLogger)({ stage: 'test' });
        logger.error('contains token=SECRET');
        const entry = JSON.parse(logs[0]);
        expect(entry.message).toContain('***');
    });
    it('emits metric events with value', () => {
        logs.length = 0;
        const logger = (0, logger_1.createLogger)({ stage: 'test' });
        logger.metric('runtime_seconds', 10, { jobId: 'job-1' });
        const entry = JSON.parse(logs[0]);
        expect(entry.event).toBe('metric');
        expect(entry.code).toBe('runtime_seconds');
        expect(entry.data.value).toBe(10);
    });
});
