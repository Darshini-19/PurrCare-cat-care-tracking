import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken, setUnauthorizedHandler } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("purrcare_cat");
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const refreshUser = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setUser(null);
      setReady(true);
      return;
    }

    try {
      const data = await api.me();
      setUser(data?.user || null);
    } catch {
      setToken(null);
      localStorage.removeItem("purrcare_cat");
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (username, password) => {
    const normalizedUsername = String(username || "").trim();

    const data = await api.login({
      username: normalizedUsername,
      password,
    });

    if (!data?.token || !data?.user) {
      throw new Error("Invalid login response from server.");
    }

    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const signup = useCallback(async (payload) => {
    const data = await api.signup(payload);

    if (!data?.user) {
      throw new Error("Invalid signup response from server.");
    }
    return data;
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      login,
      signup,
      logout,
      refreshUser,
    }),
    [user, ready, login, signup, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}