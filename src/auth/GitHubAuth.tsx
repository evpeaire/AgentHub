import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { GitHubUser } from '../types';

// GitHub OAuth Web Flow
const CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '';

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

/**
 * GitHub OAuth using a Personal Access Token (PAT) approach.
 * 
 * Since GitHub's OAuth token exchange endpoint blocks CORS from browsers,
 * and we want a fully static site with no backend proxy, users provide
 * a GitHub Personal Access Token with `public_repo` scope.
 * 
 * This is the standard approach for static GitHub-integrated tools.
 * The token is stored in localStorage and never sent anywhere except GitHub's API.
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

  // Validate stored token on mount
  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then(async (res) => {
        if (res.ok) {
          const u = await res.json();
          setUser(u);
          localStorage.setItem(USER_KEY, JSON.stringify(u));
        } else {
          setToken(null);
          setUser(null);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(() => {
    const pat = prompt(
      'Enter a GitHub Personal Access Token with "public_repo" scope.\n\n' +
      'Create one at: https://github.com/settings/tokens/new?scopes=public_repo&description=AgentHub\n\n' +
      'Your token is stored locally and only sent to GitHub\'s API.'
    );

    if (!pat?.trim()) return;

    setIsLoading(true);
    fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${pat.trim()}`, Accept: 'application/json' },
    })
      .then(async (res) => {
        if (res.ok) {
          const u = await res.json();
          setToken(pat.trim());
          setUser(u);
          localStorage.setItem(TOKEN_KEY, pat.trim());
          localStorage.setItem(USER_KEY, JSON.stringify(u));
        } else {
          alert('Invalid token. Make sure you copied the full token and it has "public_repo" scope.');
        }
      })
      .catch(() => {
        alert('Failed to verify token. Check your internet connection.');
      })
      .finally(() => setIsLoading(false));
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
