import { test, describe } from 'node:test';
import assert from 'node:assert';
import { KrakoanRunner } from '../src/engine/KrakoaRunner.js';

describe('KrakoanRunner Native Tests', () => {
  test('Runner should initialize correctly', () => {
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

  test('Runner should support plugin registration', async () => {
    const mockProgram: any = { entry: 0, text: [], code: {} };
    const runner = new KrakoanRunner(mockProgram);
    
    let pluginCalled = false;
    runner.registerPlugin('🧪', async () => {
      pluginCalled = true;
      return true;
    });

    assert.ok(runner.CommandTable['🧪']);
    await runner.CommandTable['🧪']({} as any, runner);
    assert.strictEqual(pluginCalled, true);
  });
});
