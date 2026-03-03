import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from '../../src/App';
import { login } from '../../src/api';

describe('Authentication integration', () => {
  it('calls API with login payload', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Login successful',
        user: { username: 'admin', displayName: 'Administrator' },
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await login('admin', 'admin123');

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
  });

  it('returns friendly message when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Invalid username or password.' }),
    }));

    const result = await login('admin', 'bad');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid username or password.');
  });

  it('returns fallback message when non-ok payload is not json', async () => {
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

  it('returns fallback message when non-ok payload has empty message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: '' }),
    }));

    const result = await login('admin', 'bad');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Unable to reach authentication service.');
  });

  it('navigates to dashboard on successful login response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Login successful',
        user: { username: 'admin', displayName: 'Administrator' },
      }),
    }));

    render(<App />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Welcome, Administrator')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('logs out and returns to login screen', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Login successful',
        user: { username: 'admin', displayName: 'Administrator' },
      }),
    }));

    render(<App />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Welcome, Administrator')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('shows unexpected error when request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    render(<App />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Unexpected error occurred. Please try again.')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Login' })).toBeEnabled();
  });

  it('shows fallback invalid credentials message when login result has no message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        message: '',
      }),
    }));

    render(<App />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials.')).toBeInTheDocument();
    });
  });
});
