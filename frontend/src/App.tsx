import { FormEvent, useEffect, useState } from 'react';
import { loadCurrentUser, login, logout } from './api';
import type { User } from './types';

type DashboardView = 'dashboard' | 'modules' | 'profile';

export function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeView, setActiveView] = useState<DashboardView>('dashboard');

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const result = await loadCurrentUser();
        if (!active) {
          return;
        }

        if (result.success && result.user) {
          setUser(result.user);
        }
      } catch {
        if (active) {
          setError('Unexpected error occurred. Please try again.');
        }
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await logout();
      setUser(null);
      setActiveView('dashboard');
      setError('');
    } catch {
      setUser(null);
      setActiveView('dashboard');
      setError('');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      if (result.success && result.user) {
        setUser(result.user);
        setActiveView('dashboard');
        setUsername('');
        setPassword('');
        return;
      }

      setError(result.message || 'Invalid credentials.');
    } catch {
      setError('Unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    const modules = [
      {
        title: 'Machine Learning',
        description: 'Prepare data pipelines, model training, and experiment tracking.',
      },
      {
        title: 'Deep Learning',
        description: 'Manage GPU workloads, neural architecture experiments, and model serving.',
      },
      {
        title: 'Reinforcement Learning',
        description: 'Design agents, simulation loops, rewards, and evaluation benchmarks.',
      },
      {
        title: 'AGI / ASI Research',
        description: 'Plan long-term intelligence workflows, safety checks, and scalable orchestration.',
      },
    ];

    let content = (
      <div className="grid">
        {modules.map((module) => (
          <article key={module.title}>
            <h2>{module.title}</h2>
            <p>{module.description}</p>
          </article>
        ))}
      </div>
    );

    if (activeView === 'modules') {
      content = (
        <section className="stack">
          <h2>Modules</h2>
          <p>Select a foundation area and expand it into APIs, data flows, and model workflows.</p>
          <div className="grid">
            {modules.map((module) => (
              <article key={module.title}>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
                <p className="module-status">Status: Foundation Ready</p>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (activeView === 'profile') {
      content = (
        <section className="stack profile-panel">
          <h2>Profile</h2>
          <p>
            <strong>Username:</strong> {user.username}
          </p>
          <p>
            <strong>Display Name:</strong> {user.displayName}
          </p>
          <p>
            <strong>Role:</strong> {String(user.role)}
          </p>
        </section>
      );
    }

    return (
      <>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <main id="main-content" className="page dashboard-page" aria-live="polite">
          <section className="card dashboard-card">
            <header className="panel-header">
              <h1>Learning</h1>
              <p className="welcome">Welcome, {user.displayName}</p>
            </header>
            <nav className="dashboard-nav" aria-label="Dashboard Sections">
              <button
                type="button"
                className={activeView === 'dashboard' ? 'btn btn-nav active' : 'btn btn-nav'}
                aria-pressed={activeView === 'dashboard'}
                onClick={() => setActiveView('dashboard')}
              >
                Dashboard
              </button>
              <button
                type="button"
                className={activeView === 'modules' ? 'btn btn-nav active' : 'btn btn-nav'}
                aria-pressed={activeView === 'modules'}
                onClick={() => setActiveView('modules')}
              >
                Modules
              </button>
              <button
                type="button"
                className={activeView === 'profile' ? 'btn btn-nav active' : 'btn btn-nav'}
                aria-pressed={activeView === 'profile'}
                onClick={() => setActiveView('profile')}
              >
                Profile
              </button>
            </nav>
            <button type="button" onClick={handleLogout} className="btn btn-primary logout-button" disabled={loggingOut}>
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
            {content}
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <main id="main-content" className="page login-page">
        <section className="card login-card" aria-labelledby="learning-login-title">
          <h1 id="learning-login-title">Learning</h1>
          <p className="subtitle">Sign in to continue</p>
          <form onSubmit={handleLogin} aria-busy={loading}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              className="input-field"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              autoComplete="username"
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input-field"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />

            {error ? (
              <p className="error" role="alert" aria-live="assertive">
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
