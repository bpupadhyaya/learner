import type { User } from './types';

type LoginResponse = {
  success: boolean;
  message: string;
  user?: User;
};

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    try {
      const payload = (await response.json()) as Partial<LoginResponse>;
      return {
        success: false,
        message: payload.message || 'Unable to reach authentication service.',
      };
    } catch {
      // Keep fallback message when response body is absent or invalid JSON.
    }

    return {
      success: false,
      message: 'Unable to reach authentication service.',
    };
  }

  return response.json();
}
