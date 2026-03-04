import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Theme integration', () => {
  it('uses tokenized design-system styles with responsive and accessibility hooks', () => {
    const styleText = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');

    expect(styleText).toContain('--color-bg-canvas: #0f172a;');
    expect(styleText).toContain('--color-bg-surface: #131c2e;');
    expect(styleText).toContain('--color-brand: #2f81f7;');
    expect(styleText).toContain('--color-text-primary: #e6edf7;');
    expect(styleText).toContain('.skip-link');
    expect(styleText).toContain('.btn');
    expect(styleText).toContain('.input-field');
    expect(styleText).toContain('@media (max-width: 768px)');
    expect(styleText).toContain('.btn-nav');
    expect(styleText).toContain('.btn-primary');
    expect(styleText).toContain('.page {');
    expect(styleText).toContain('.card {');
    expect(styleText).toContain('.login-card {');
    expect(styleText).toContain('.grid {');
  });
});
