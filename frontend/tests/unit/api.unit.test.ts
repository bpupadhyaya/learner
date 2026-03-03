import { login } from '../../src/api';

describe('api unit', () => {
  it('returns payload when response is ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Login successful.',
        user: { username: 'admin', displayName: 'Administrator' },
      }),
    }));

    const result = await login('admin', 'admin123');

    expect(result.success).toBe(true);
    expect(result.message).toBe('Login successful.');
    expect(result.user?.username).toBe('admin');
  });

  it('returns non-ok payload message when available', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Invalid username or password.' }),
    }));

    const result = await login('admin', 'bad');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid username or password.');
  });

  it('returns fallback non-ok message on empty message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: '' }),
    }));

    const result = await login('admin', 'bad');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Unable to reach authentication service.');
  });

  it('returns fallback non-ok message on invalid JSON response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error('invalid json');
      },
    }));

    const result = await login('admin', 'bad');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Unable to reach authentication service.');
  });
});
