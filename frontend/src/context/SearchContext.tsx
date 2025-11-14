import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { EventSummary } from "../components/EventCard";

type SearchState = {
  keyword: string;
  category: string;
  distance: string;
  location: string;
  autoDetect: boolean;
  events: EventSummary[];
  scrollPosition: number;
};

type SearchContextValue = {
  searchState: SearchState | null;
  saveSearchState: (state: SearchState) => void;
  clearSearchState: () => void;
  consumeSearchState: () => SearchState | null;
};

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

const STORAGE_KEY = "searchState";

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchState, setSearchState] = useState<SearchState | null>(null);

  // On mount, check if there's saved state in sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSearchState(JSON.parse(saved));
        // Clear it immediately so it's only used once
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const saveSearchState = useCallback((state: SearchState) => {
    setSearchState(state);
    // Also save to sessionStorage so it persists across navigation
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("SearchContext: failed to write sessionStorage", e);
    }
  }, []);

  const clearSearchState = useCallback(() => {
    setSearchState(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("SearchContext: failed to remove sessionStorage", e);
    }
  }, []);

  const consumeSearchState = useCallback((): SearchState | null => {
    const state = searchState;
    setSearchState(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("SearchContext: failed to remove sessionStorage on consume", e);
    }
    return state;
  }, [searchState]);

  return (
    <SearchContext.Provider value={{ searchState, saveSearchState, clearSearchState, consumeSearchState }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error("useSearch must be used inside SearchProvider");
  }
  return ctx;
}
