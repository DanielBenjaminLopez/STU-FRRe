import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchMe, login as apiLogin, type UserInfo } from "../api/auth";
import {
  ApiError,
  getAdminToken,
  setAdminToken,
  clearAdminToken,
} from "../api/client";

interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(() => !!getAdminToken());

  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const verify = (attempt = 0) => {
      fetchMe()
        .then((u) => {
          if (!cancelled) {
            setUser(u);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (cancelled) return;
          const isAuthError =
            err instanceof ApiError &&
            (err.status === 401 || err.status === 403);
          if (isAuthError) {
            clearAdminToken();
            setIsLoading(false);
          } else if (attempt < 5) {
            retryTimer = setTimeout(() => verify(attempt + 1), 2000);
          } else {
            setIsLoading(false);
          }
        });
    };

    verify();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  const login = async (username: string, password: string) => {
    const { access } = await apiLogin(username, password);
    setAdminToken(access);
    const me = await fetchMe();
    setUser(me);
  };

  const logout = () => {
    clearAdminToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
