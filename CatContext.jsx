import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "./AuthContext.jsx";

const CatContext = createContext(null);

export function CatProvider({ children }) {
  const { user, ready: authReady } = useAuth();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCatId, setSelectedCatIdState] = useState(
    () => localStorage.getItem("purrcare_cat") || ""
  );

  const refreshCats = useCallback(async () => {
    if (!user) {
      setCats([]);
      setError(null);
      setLoading(false);
      setSelectedCatIdState((prev) => {
        if (prev) localStorage.removeItem("purrcare_cat");
        return "";
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.listCats();
      setCats(data);

      setSelectedCatIdState((prev) => {
        if (!data.length) {
          localStorage.removeItem("purrcare_cat");
          return "";
        }

        if (prev && data.some((c) => c._id === prev)) {
          localStorage.setItem("purrcare_cat", prev);
          return prev;
        }

        const first = data[0]._id;
        localStorage.setItem("purrcare_cat", first);
        return first;
      });
    } catch (e) {
      setError(e.message);
      setCats([]);
      localStorage.removeItem("purrcare_cat");
      setSelectedCatIdState("");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authReady) return;
    refreshCats();
  }, [authReady, user, refreshCats]);

  const setSelectedCatId = useCallback((id) => {
    setSelectedCatIdState(id);
    if (id) localStorage.setItem("purrcare_cat", id);
    else localStorage.removeItem("purrcare_cat");
  }, []);

  const clearSelectedCat = useCallback(() => {
    setSelectedCatIdState("");
    localStorage.removeItem("purrcare_cat");
  }, []);

  const selectedCat = useMemo(() => {
    return cats.find((cat) => cat._id === selectedCatId) || null;
  }, [cats, selectedCatId]);

  const value = useMemo(
    () => ({
      cats,
      loading,
      error,
      refreshCats,
      selectedCatId,
      selectedCat,
      setSelectedCatId,
      clearSelectedCat,
    }),
    [cats, loading, error, refreshCats, selectedCatId, selectedCat, setSelectedCatId, clearSelectedCat]
  );

  return <CatContext.Provider value={value}>{children}</CatContext.Provider>;
}

export function useCats() {
  const ctx = useContext(CatContext);
  if (!ctx) throw new Error("useCats must be used within CatProvider");
  return ctx;
}