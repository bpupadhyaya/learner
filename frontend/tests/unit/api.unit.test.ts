import { loadCurrentUser, login, logout } from '../../src/api';

type MockHttpResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

describe('api unit', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('stores session on successful login with tokens', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Login successful.',
          user: { username: 'admin', displayName: 'Administrator', role: 'ADMIN' },
          accessToken: 'access-1',
          refreshToken: 'refresh-1',
          tokenType: 'Bearer',
        }),
      } as MockHttpResponse),
    );

    const result = await login('admin', 'admin123');

    expect(result.success).toBe(true);
    expect(JSON.parse(localStorage.getItem('learning.session') ?? '{}')).toEqual({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      tokenType: 'Bearer',
    });
  });

  it('does not store session when login success payload has missing tokens', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Login successful.',
          user: { username: 'admin', displayName: 'Administrator' },
        }),
      } as MockHttpResponse),
    );

    const result = await login('admin', 'admin123');

    expect(result.success).toBe(true);
    expect(localStorage.getItem('learning.session')).toBeNull();
  });

  it('returns non-ok payload message when available', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid username or password.' }),
      } as MockHttpResponse),
    );

    const result = await login('admin', 'bad');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid username or password.');
  });

  it('returns fallback non-ok message on invalid JSON response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('invalid json');
        },
      } as MockHttpResponse),
    );

    const result = await login('admin', 'bad');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Unable to reach authentication service.');
  });

  it('returns fallback non-ok message when payload message is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: '' }),
      } as MockHttpResponse),
    );

    const result = await login('admin', 'bad');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Unable to reach authentication service.');
  });

  it('returns login payload and skips session write when success is false with ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: false, message: 'Invalid username or password.' }),
      } as MockHttpResponse),
    );

    const result = await login('admin', 'bad');

    expect(result.success).toBe(false);
    expect(localStorage.getItem('learning.session')).toBeNull();
  });

  it('returns not authenticated when session is absent', async () => {
    const result = await loadCurrentUser();

    expect(result.success).toBe(false);
    expect(result.message).toBe('Not authenticated.');
  });

  it('returns not authenticated when stored session JSON is invalid', async () => {
    localStorage.setItem('learning.session', 'not-json');

    const result = await loadCurrentUser();

    expect(result.success).toBe(false);
    expect(result.message).toBe('Not authenticated.');
  });

  it('returns not authenticated when stored session is missing required fields', async () => {
    localStorage.setItem('learning.session', JSON.stringify({ accessToken: 'token-only' }));

    const result = await loadCurrentUser();

    expect(result.success).toBe(false);
    expect(result.message).toBe('Not authenticated.');
  });

  it('loads user profile when access token is valid', async () => {
    localStorage.setItem(
      'learning.session',
      JSON.stringify({ accessToken: 'access-1', refreshToken: 'refresh-1', tokenType: 'Bearer' }),
    );
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ username: 'admin', displayName: 'Administrator', role: 'ADMIN' }),
      } as MockHttpResponse);
    vi.stubGlobal('fetch', mockFetch);

    const result = await loadCurrentUser();

    expect(result.success).toBe(true);
    expect(result.user?.username).toBe('admin');
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', {
      method: 'GET',
      headers: { Authorization: 'Bearer access-1' },
    });
  });

  it('returns backend message for non-401 me endpoint failures', async () => {
    localStorage.setItem(
      'learning.session',
      JSON.stringify({ accessToken: 'access-1', refreshToken: 'refresh-1', tokenType: 'Bearer' }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Access denied.' }),
      } as MockHttpResponse),
    );

    const result = await loadCurrentUser();

    expect(result.success).toBe(false);
    expect(result.message).toBe('Access denied.');
  });

  it('returns fallback message for non-401 me endpoint failures without JSON payload', async () => {
    localStorage.setItem(
      'learning.session',
      JSON.stringify({ accessToken: 'access-1', refreshToken: 'refresh-1', tokenType: 'Bearer' }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('invalid');
        },
      } as MockHttpResponse),
    );

    const result = await loadCurrentUser();

    expect(result.success).toBe(false);
    expect(result.message).toBe('Unable to load profile.');
  });

  it('clears session and returns expiry message when refresh endpoint fails', async () => {
    localStorage.setItem(
      'learning.session',
      JSON.stringify({ accessToken: 'expired-token', refreshToken: 'refresh-1', tokenType: 'Bearer' }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as MockHttpResponse)
        .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as MockHttpResponse),
    );

    const result = await loadCurrentUser();

    expect(result.success).toBe(false);
    expect(result.message).toBe('Session expired. Please sign in again.');
    expect(localStorage.getItem('learning.session')).toBeNull();
  });

  it('clears session when refresh endpoint returns non-success payload', async () => {
    localStorage.setItem(
      'learning.session',
      JSON.stringify({ accessToken: 'expired-token', refreshToken: 'refresh-1', tokenType: 'Bearer' }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as MockHttpResponse)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: false, message: 'invalid refresh' }),
        } as MockHttpResponse),
    );

    const result = await loadCurrentUser();

    expect(result.success).toBe(false);
    expect(result.message).toBe('Session expired. Please sign in again.');
    expect(localStorage.getItem('learning.session')).toBeNull();
  });

  it('refreshes session and retries profile call after 401', async () => {
    localStorage.setItem(
      'learning.session',
      JSON.stringify({ accessToken: 'expired-token', refreshToken: 'refresh-1', tokenType: 'Bearer' }),
    );
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as MockHttpResponse)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Token refresh successful.',
          accessToken: 'access-2',
          refreshToken: 'refresh-2',
          tokenType: 'Bearer',
        }),
      } as MockHttpResponse)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ username: 'admin', displayName: 'Administrator', role: 'ADMIN' }),
      } as MockHttpResponse);
    vi.stubGlobal('fetch', mockFetch);

    const result = await loadCurrentUser();

    expect(result.success).toBe(true);
    expect(result.user?.displayName).toBe('Administrator');
    expect(JSON.parse(localStorage.getItem('learning.session') ?? '{}')).toEqual({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      tokenType: 'Bearer',
    });
    expect(mockFetch).toHaveBeenNthCalledWith(3, '/api/auth/me', {
      method: 'GET',
      headers: { Authorization: 'Bearer access-2' },
    });
  });

  it('uses default bearer token type when refresh payload omits token type', async () => {
    localStorage.setItem(
      'learning.session',
      JSON.stringify({ accessToken: 'expired-token', refreshToken: 'refresh-1', tokenType: 'Bearer' }),
    );
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as MockHttpResponse)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Token refresh successful.',
          accessToken: 'access-2',
          refreshToken: 'refresh-2',
        }),
      } as MockHttpResponse)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ username: 'admin', displayName: 'Administrator', role: 'ADMIN' }),
      } as MockHttpResponse);
    vi.stubGlobal('fetch', mockFetch);

    const result = await loadCurrentUser();

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenNthCalledWith(3, '/api/auth/me', {
      method: 'GET',
      headers: { Authorization: 'Bearer access-2' },
    });
  });

  it('clears session when refresh success payload misses access token', async () => {
    localStorage.setItem(
      'learning.session',
      JSON.stringify({ accessToken: 'expired-token', refreshToken: 'refresh-1', tokenType: 'Bearer' }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as MockHttpResponse)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, refreshToken: 'refresh-2', tokenType: 'Bearer' }),
        } as MockHttpResponse),
    );

    const result = await loadCurrentUser();

    expect(result.success).toBe(false);
    expect(result.message).toBe('Session expired. Please sign in again.');
    expect(localStorage.getItem('learning.session')).toBeNull();
  });

  it('clears session when refresh success payload misses refresh token', async () => {
    localStorage.setItem(
      'learning.session',
      JSON.stringify({ accessToken: 'expired-token', refreshToken: 'refresh-1', tokenType: 'Bearer' }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as MockHttpResponse)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, accessToken: 'access-2', tokenType: 'Bearer' }),
        } as MockHttpResponse),
    );

    const result = await loadCurrentUser();

    expect(result.success).toBe(false);
    expect(result.message).toBe('Session expired. Please sign in again.');
    expect(localStorage.getItem('learning.session')).toBeNull();
  });

  it('clears session when retry after refresh still fails', async () => {
    localStorage.setItem(
      'learning.session',
      JSON.stringify({ accessToken: 'expired-token', refreshToken: 'refresh-1', tokenType: 'Bearer' }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as MockHttpResponse)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            message: 'Token refresh successful.',
            accessToken: 'access-2',
            refreshToken: 'refresh-2',
            tokenType: 'Bearer',
          }),
        } as MockHttpResponse)
        .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as MockHttpResponse),
    );

    const result = await loadCurrentUser();

    expect(result.success).toBe(false);
    expect(result.message).toBe('Session expired. Please sign in again.');
    expect(localStorage.getItem('learning.session')).toBeNull();
  });

  it('returns successful logout when no session exists', async () => {
    const result = await logout();

    expect(result.success).toBe(true);
    expect(result.message).toBe('Logout successful.');
  });

  it('calls logout endpoint and clears session on success', async () => {
    localStorage.setItem(
      'learning.session',
      JSON.stringify({ accessToken: 'access-1', refreshToken: 'refresh-1', tokenType: 'Bearer' }),
    );
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, message: 'Logout successful.' }),
    } as MockHttpResponse);
    vi.stubGlobal('fetch', mockFetch);

    const result = await logout();

    expect(result.success).toBe(true);
    expect(result.message).toBe('Logout successful.');
    expect(localStorage.getItem('learning.session')).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'refresh-1' }),
    });
  });

  it('returns backend message when logout endpoint fails', async () => {
    localStorage.setItem(
      'learning.session',
      JSON.stringify({ accessToken: 'access-1', refreshToken: 'refresh-1', tokenType: 'Bearer' }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid or expired refresh token.' }),
      } as MockHttpResponse),
    );

    const result = await logout();

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid or expired refresh token.');
    expect(localStorage.getItem('learning.session')).toBeNull();
  });

  it('returns fallback message when logout failure payload cannot be parsed', async () => {
    localStorage.setItem(
      'learning.session',
      JSON.stringify({ accessToken: 'access-1', refreshToken: 'refresh-1', tokenType: 'Bearer' }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('invalid json');
        },
      } as MockHttpResponse),
    );

    const result = await logout();

    expect(result.success).toBe(false);
    expect(result.message).toBe('Unable to complete logout.');
    expect(localStorage.getItem('learning.session')).toBeNull();
  });
});
