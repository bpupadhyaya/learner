import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from '../../src/App';
import { loadCurrentUser, login, logout } from '../../src/api';

type MockHttpResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

describe('Authentication integration', () => {
  afterEach(() => {
    localStorage.clear();
  });

  function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

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

  it('shows Learning title and login form fields', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Learning' })).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('shows backend message for invalid credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: false,
          message: 'Invalid username or password.',
        }),
      } as MockHttpResponse),
    );

    render(<App />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid username or password.')).toBeInTheDocument();
    });
  });

  it('shows fallback invalid credentials message when backend message is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: false,
          message: '',
        }),
      } as MockHttpResponse),
    );

    render(<App />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials.')).toBeInTheDocument();
    });
  });

  it('restores an active session and shows dashboard on mount', async () => {
    localStorage.setItem(
      'learning.session',
      JSON.stringify({ accessToken: 'access-1', refreshToken: 'refresh-1', tokenType: 'Bearer' }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ username: 'admin', displayName: 'Administrator', role: 'ADMIN' }),
      } as MockHttpResponse),
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Welcome, Administrator')).toBeInTheDocument();
    });
  });

  it('navigates to modules view from dashboard', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Login successful',
          user: { username: 'admin', displayName: 'Administrator', role: 'ADMIN' },
          accessToken: 'access-1',
          refreshToken: 'refresh-1',
          tokenType: 'Bearer',
        }),
      } as MockHttpResponse),
    );

    render(<App />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Welcome, Administrator')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Modules' }));

    expect(screen.getByRole('heading', { name: 'Modules' })).toBeInTheDocument();
    expect(screen.getAllByText('Status: Foundation Ready').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }));
    expect(screen.getByRole('heading', { name: 'Machine Learning' })).toBeInTheDocument();
  });

  it('navigates to profile view from dashboard', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Login successful',
          user: { username: 'admin', displayName: 'Administrator', role: 'ADMIN' },
          accessToken: 'access-1',
          refreshToken: 'refresh-1',
          tokenType: 'Bearer',
        }),
      } as MockHttpResponse),
    );

    render(<App />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Welcome, Administrator')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Profile' }));

    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === 'Username: admin')).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === 'Display Name: Administrator'),
    ).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === 'Role: ADMIN')).toBeInTheDocument();
  });

  it('logs in and logs out with backend logout endpoint', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Login successful',
          user: { username: 'admin', displayName: 'Administrator', role: 'ADMIN' },
          accessToken: 'access-1',
          refreshToken: 'refresh-1',
          tokenType: 'Bearer',
        }),
      } as MockHttpResponse)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: 'Logout successful.' }),
      } as MockHttpResponse);
    vi.stubGlobal('fetch', mockFetch);

    render(<App />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Welcome, Administrator')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    });
  });

  it('does not show error message when backend logout returns failure and user is logged out', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Login successful',
          user: { username: 'admin', displayName: 'Administrator' },
          accessToken: 'access-1',
          refreshToken: 'refresh-1',
          tokenType: 'Bearer',
        }),
      } as MockHttpResponse)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid or expired refresh token.' }),
      } as MockHttpResponse);
    vi.stubGlobal('fetch', mockFetch);

    render(<App />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Welcome, Administrator')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
      expect(screen.queryByText('Invalid or expired refresh token.')).not.toBeInTheDocument();
    });
  });

  it('does not show generic logout error when logout request throws', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Login successful',
          user: { username: 'admin', displayName: 'Administrator' },
          accessToken: 'access-1',
          refreshToken: 'refresh-1',
          tokenType: 'Bearer',
        }),
      } as MockHttpResponse)
      .mockRejectedValueOnce(new Error('network failed'));
    vi.stubGlobal('fetch', mockFetch);

    render(<App />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Welcome, Administrator')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
      expect(screen.queryByText('Unable to complete logout.')).not.toBeInTheDocument();
    });
  });

  it('does not show fallback logout error when backend message is empty', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Login successful',
          user: { username: 'admin', displayName: 'Administrator' },
          accessToken: 'access-1',
          refreshToken: 'refresh-1',
          tokenType: 'Bearer',
        }),
      } as MockHttpResponse)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: '' }),
      } as MockHttpResponse);
    vi.stubGlobal('fetch', mockFetch);

    render(<App />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Welcome, Administrator')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
      expect(screen.queryByText('Unable to complete logout.')).not.toBeInTheDocument();
    });
  });

  it('does not show fallback logout error when successful HTTP response has empty message', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Login successful',
          user: { username: 'admin', displayName: 'Administrator' },
          accessToken: 'access-1',
          refreshToken: 'refresh-1',
          tokenType: 'Bearer',
        }),
      } as MockHttpResponse)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: false, message: '' }),
      } as MockHttpResponse);
    vi.stubGlobal('fetch', mockFetch);

    render(<App />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Welcome, Administrator')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
      expect(screen.queryByText('Unable to complete logout.')).not.toBeInTheDocument();
    });
  });

  it('shows logging-out state while logout is in-flight', async () => {
    const pendingLogout = deferred<MockHttpResponse>();
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Login successful',
          user: { username: 'admin', displayName: 'Administrator' },
          accessToken: 'access-1',
          refreshToken: 'refresh-1',
          tokenType: 'Bearer',
        }),
      } as MockHttpResponse)
      .mockImplementationOnce(() => pendingLogout.promise);
    vi.stubGlobal('fetch', mockFetch);

    render(<App />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Welcome, Administrator')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    expect(screen.getByRole('button', { name: 'Logging out...' })).toBeDisabled();

    pendingLogout.resolve({
      ok: true,
      status: 200,
      json: async () => ({ success: true, message: 'Logout successful.' }),
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    });
  });

  it('shows unexpected error when login request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network failed')));

    render(<App />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Unexpected error occurred. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows unexpected error when session restore throws', async () => {
    localStorage.setItem(
      'learning.session',
      JSON.stringify({ accessToken: 'access-1', refreshToken: 'refresh-1', tokenType: 'Bearer' }),
    );
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network failed')));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Unexpected error occurred. Please try again.')).toBeInTheDocument();
    });
  });

  it('ignores session restore result when component unmounts before completion', async () => {
    localStorage.setItem(
      'learning.session',
      JSON.stringify({ accessToken: 'access-1', refreshToken: 'refresh-1', tokenType: 'Bearer' }),
    );
    const pendingMe = deferred<MockHttpResponse>();
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => pendingMe.promise));

    const { unmount } = render(<App />);
    unmount();

    pendingMe.resolve({
      ok: true,
      status: 200,
      json: async () => ({ username: 'admin', displayName: 'Administrator', role: 'ADMIN' }),
    });

    await waitFor(() => {
      expect(screen.queryByText('Welcome, Administrator')).not.toBeInTheDocument();
    });
  });
});
