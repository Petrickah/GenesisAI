import { describe, it } from 'node:test';
import assert from 'node:assert';
import { KrakoanRunner } from '../src/engine/KrakoaRunner.js';

describe('GenesisAI Environment', () => {
  it('should correctly import KrakoanRunner', () => {
    assert.ok(KrakoanRunner);
  });

  it('should initialize a runner with mock data', () => {
    const mockProgram: any = {
      entry: 0,
      text: [],
      code: {
        0: { type: '👤', id: 'TEST', params: {}, next: [-1], timestamp: Date.now() }
      }
    };
    const runner = new KrakoanRunner(mockProgram);
    assert.strictEqual(runner.Registers.IP, 0);
    assert.strictEqual(runner.Registers.Status, 'RUNNING');
  });
});
