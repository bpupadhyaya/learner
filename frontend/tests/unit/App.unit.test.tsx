import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from '../../src/App';

type MockHttpResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

describe('App unit', () => {
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

  it('shows Learning title and login form fields', () => {
    render(<App />);

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toBeInTheDocument();
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
      const error = screen.getByText('Invalid username or password.');
      expect(error).toBeInTheDocument();
      expect(error).toHaveAttribute('role', 'alert');
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
    expect(screen.getByRole('button', { name: 'Modules' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Dashboard' })).toHaveAttribute('aria-pressed', 'false');

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
