import type { User } from './types';

type LoginResponse = {
  success: boolean;
  message: string;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  role?: string;
};

type UserResponse = {
  success: boolean;
  message: string;
  user?: User;
};

type LogoutResponse = {
  success: boolean;
  message: string;
};

type Session = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
};

const SESSION_KEY = 'learning.session';

function readSession(): Session | null {
  const rawValue = localStorage.getItem(SESSION_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<Session>;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.tokenType) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      tokenType: parsed.tokenType,
    };
  } catch {
    return null;
  }
}

function writeSession(response: LoginResponse): void {
  if (!response.accessToken || !response.refreshToken) {
    return;
  }

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      tokenType: response.tokenType || 'Bearer',
    }),
  );
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

async function readMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message || fallback;
  } catch {
    return fallback;
  }
}

async function fetchUser(accessToken: string, tokenType: string): Promise<Response> {
  return fetch('/api/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `${tokenType} ${accessToken}`,
    },
  });
}

async function refreshSession(session: Session): Promise<Session | null> {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });

  if (!response.ok) {
    clearSession();
    return null;
  }

  const payload = (await response.json()) as LoginResponse;
  if (!payload.success || !payload.accessToken || !payload.refreshToken) {
    clearSession();
    return null;
  }

  writeSession(payload);
  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    tokenType: payload.tokenType || 'Bearer',
  };
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    return {
      success: false,
      message: await readMessage(response, 'Unable to reach authentication service.'),
    };
  }

  const payload = (await response.json()) as LoginResponse;
  if (payload.success) {
    writeSession(payload);
  }

  return payload;
}

export async function loadCurrentUser(): Promise<UserResponse> {
  const currentSession = readSession();
  if (!currentSession) {
    return {
      success: false,
      message: 'Not authenticated.',
    };
  }

  const firstResponse = await fetchUser(currentSession.accessToken, currentSession.tokenType);
  if (firstResponse.ok) {
    const user = (await firstResponse.json()) as User;
    return {
      success: true,
      message: 'Profile loaded.',
      user,
    };
  }

  if (firstResponse.status !== 401) {
    return {
      success: false,
      message: await readMessage(firstResponse, 'Unable to load profile.'),
    };
  }

  const refreshedSession = await refreshSession(currentSession);
  if (!refreshedSession) {
    return {
      success: false,
      message: 'Session expired. Please sign in again.',
    };
  }

  const secondResponse = await fetchUser(refreshedSession.accessToken, refreshedSession.tokenType);
  if (!secondResponse.ok) {
    clearSession();
    return {
      success: false,
      message: 'Session expired. Please sign in again.',
    };
  }

  const user = (await secondResponse.json()) as User;
  return {
    success: true,
    message: 'Profile loaded.',
    user,
  };
}

export async function logout(): Promise<LogoutResponse> {
  const currentSession = readSession();
  if (!currentSession) {
    return {
      success: true,
      message: 'Logout successful.',
    };
  }

  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken: currentSession.refreshToken }),
  });

  clearSession();

  if (!response.ok) {
    return {
      success: false,
      message: await readMessage(response, 'Unable to complete logout.'),
    };
  }

  const payload = (await response.json()) as LogoutResponse;
  return {
    success: payload.success,
    message: payload.message,
  };
}
