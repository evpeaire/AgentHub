import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { GitHubUser } from '../types';

// GitHub OAuth Device Flow — no server needed.
// Set these in your .env or hardcode for your GitHub OAuth App.
const CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '';

// Repo where agent data lives (owner/repo format)
export const REPO_OWNER = import.meta.env.VITE_REPO_OWNER || '';
export const REPO_NAME = import.meta.env.VITE_REPO_NAME || '';

interface GitHubAuthContextType {
  user: GitHubUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  deviceCode: { user_code: string; verification_uri: string } | null;
}

const GitHubAuthContext = createContext<GitHubAuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  isLoading: false,
  deviceCode: null,
});

export const useGitHubAuth = () => useContext(GitHubAuthContext);

const TOKEN_KEY = 'agent-hub-gh-token';
const USER_KEY = 'agent-hub-gh-user';

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
  const [deviceCode, setDeviceCode] = useState<{ user_code: string; verification_uri: string } | null>(null);

  // Validate stored token on mount
  useEffect(() => {
    if (!token) return;
    fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then(async (res) => {
        if (res.ok) {
          const u = await res.json();
          setUser(u);
          localStorage.setItem(USER_KEY, JSON.stringify(u));
        } else {
          // Token expired or revoked
          setToken(null);
          setUser(null);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      })
      .catch(() => {});
  }, []);

  const login = useCallback(async () => {
    if (!CLIENT_ID) {
      alert('GitHub OAuth is not configured. Set VITE_GITHUB_CLIENT_ID in your .env file.');
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Request device code
      const codeRes = await fetch('https://github.com/login/device/code', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          scope: 'public_repo',
        }),
      });

      if (!codeRes.ok) throw new Error('Failed to initiate device flow');

      const codeData = await codeRes.json();
      setDeviceCode({
        user_code: codeData.user_code,
        verification_uri: codeData.verification_uri,
      });

      // Open the verification URL
      window.open(codeData.verification_uri, '_blank');

      // Step 2: Poll for token
      const interval = codeData.interval || 5;
      const expiresAt = Date.now() + (codeData.expires_in || 900) * 1000;

      const poll = async (): Promise<string> => {
        while (Date.now() < expiresAt) {
          await new Promise((r) => setTimeout(r, interval * 1000));

          const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              client_id: CLIENT_ID,
              device_code: codeData.device_code,
              grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            }),
          });

          const tokenData = await tokenRes.json();

          if (tokenData.access_token) {
            return tokenData.access_token;
          }

          if (tokenData.error === 'authorization_pending') continue;
          if (tokenData.error === 'slow_down') {
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }
          if (tokenData.error === 'expired_token') break;
          if (tokenData.error === 'access_denied') break;
        }
        throw new Error('Authentication timed out or was denied');
      };

      const accessToken = await poll();
      setToken(accessToken);
      localStorage.setItem(TOKEN_KEY, accessToken);

      // Fetch user info
      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      });
      if (userRes.ok) {
        const u = await userRes.json();
        setUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      }

      setDeviceCode(null);
    } catch (err) {
      console.error('GitHub auth failed:', err);
      setDeviceCode(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setDeviceCode(null);
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
        deviceCode,
      }}
    >
      {children}
    </GitHubAuthContext.Provider>
  );
}
