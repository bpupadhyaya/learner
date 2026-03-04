import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Theme integration', () => {
  it('uses a dark LiveCoinWatch-like color palette while keeping existing layout classes', () => {
    const styleText = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');

    expect(styleText).toContain('background: radial-gradient(circle at top right, #1b2740, #0f172a 55%);');
    expect(styleText).toContain('color: #e6edf7;');
    expect(styleText).toContain('background: #131c2e;');
    expect(styleText).toContain('color: #c9d4e6;');
    expect(styleText).toContain('background: #2f81f7;');
    expect(styleText).toContain('color: #ffffff;');
    expect(styleText).toContain('.page {');
    expect(styleText).toContain('.card {');
    expect(styleText).toContain('.login-card {');
    expect(styleText).toContain('.grid {');
  });
});
