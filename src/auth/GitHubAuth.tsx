import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { GitHubUser } from '../types';

// GitHub OAuth Web Flow (redirect-based SSO)
const CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '';
const OAUTH_PROXY = import.meta.env.VITE_OAUTH_PROXY_URL || '';

// Repo where agent data lives (owner/repo format)
export const REPO_OWNER = import.meta.env.VITE_REPO_OWNER || '';
export const REPO_NAME = import.meta.env.VITE_REPO_NAME || '';

interface GitHubAuthContextType {
  user: GitHubUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
}

const GitHubAuthContext = createContext<GitHubAuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  isLoading: false,
});

export const useGitHubAuth = () => useContext(GitHubAuthContext);

const TOKEN_KEY = 'agent-hub-gh-token';
const USER_KEY = 'agent-hub-gh-user';
const STATE_KEY = 'agent-hub-gh-state';

/**
 * GitHub OAuth SSO — standard redirect-based flow.
 *
 * 1. User clicks "Sign in with GitHub"
 * 2. Redirected to GitHub to authorize
 * 3. GitHub redirects back with ?code=...
 * 4. Code is exchanged for a token via a Cloudflare Worker proxy
 * 5. Token is stored in localStorage
 */
export function GitHubAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  });
  const [user, setUser] = useState<GitHubUser | null>(() => {
    try {
      const s = localStorage.getItem(USER_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Handle OAuth callback — check for ?code= in the URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const returnedState = params.get('state');
    const savedState = sessionStorage.getItem(STATE_KEY);

    if (code && returnedState && savedState === returnedState) {
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      sessionStorage.removeItem(STATE_KEY);

      // Exchange code for token
      setIsLoading(true);
      exchangeCodeForToken(code)
        .then(async (accessToken) => {
          if (!accessToken) {
            alert('Failed to sign in. Please try again.');
            return;
          }
          setToken(accessToken);
          localStorage.setItem(TOKEN_KEY, accessToken);

          const u = await fetchUser(accessToken);
          if (u) {
            setUser(u);
            localStorage.setItem(USER_KEY, JSON.stringify(u));
          }
        })
        .catch(() => alert('Sign in failed. Please try again.'))
        .finally(() => setIsLoading(false));
    }
  }, []);

  // Validate stored token on mount
  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    fetchUser(token)
      .then((u) => {
        if (u) {
          setUser(u);
          localStorage.setItem(USER_KEY, JSON.stringify(u));
        } else {
          setToken(null);
          setUser(null);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(() => {
    if (!CLIENT_ID) {
      alert('GitHub OAuth is not configured.');
      return;
    }

    // Generate random state for CSRF protection
    const state = crypto.randomUUID();
    sessionStorage.setItem(STATE_KEY, state);

    // Build the redirect URL — GitHub Pages uses HashRouter,
    // so the callback comes back to the root path
    const redirectUri = window.location.origin + window.location.pathname;

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'public_repo');
    authUrl.searchParams.set('state', state);

    window.location.href = authUrl.toString();
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  return (
    <GitHubAuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </GitHubAuthContext.Provider>
  );
}

async function exchangeCodeForToken(code: string): Promise<string | null> {
  if (!OAUTH_PROXY) {
    console.error('VITE_OAUTH_PROXY_URL is not set');
    return null;
  }
  const res = await fetch(OAUTH_PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token || null;
}

async function fetchUser(token: string): Promise<GitHubUser | null> {
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
