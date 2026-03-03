import { it, expect, vi } from 'vitest';

const renderMock = vi.fn();
const createRootMock = vi.fn(() => ({ render: renderMock }));

vi.mock('react-dom/client', () => ({
  default: {
    createRoot: createRootMock,
  },
  createRoot: createRootMock,
}));

it('bootstraps react app in integration suite', async () => {
  document.body.innerHTML = '<div id="root"></div>';
  await import('../../src/main');

  expect(createRootMock).toHaveBeenCalled();
  expect(renderMock).toHaveBeenCalled();
});
