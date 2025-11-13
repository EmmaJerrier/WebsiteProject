import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import api from "../api/client";
import type { EventSummary } from "../components/EventCard";

type FavoritesMap = Record<string, EventSummary>;

type FavoritesContextValue = {
  favorites: FavoritesMap;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (event: EventSummary) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoritesMap>({});

  // Load favorites from backend on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<EventSummary[]>("/favorites");
        const list = res.data ?? [];
        const map: FavoritesMap = {};
        for (const e of list) {
          map[e.id] = e;
        }
        setFavorites(map);
      } catch (err) {
        console.error("Failed to load favorites", err);
        toast.error("Could not load favorites.");
      }
    })();
  }, []);

  const isFavorite = (id: string) => Boolean(favorites[id]);

  const toggleFavorite = (event: EventSummary) => {
    const currentlyFav = Boolean(favorites[event.id]);

    // ----- ADD -----
    if (!currentlyFav) {
      // optimistic local update
      setFavorites((prev) => ({ ...prev, [event.id]: event }));

      // toast: "... added to favorites!"
      toast.success(`${event.name} added to favorites!`);

      // persist on backend
      api.post("/favorites", event).catch((err) => {
        console.error("Failed to save favorite", err);
        // revert & notify
        setFavorites((prev) => {
          const copy = { ...prev };
          delete copy[event.id];
          return copy;
        });
        toast.error(`Could not add ${event.name} to favorites.`);
      });

      return;
    }

    // ----- REMOVE -----
    const removedEvent = favorites[event.id];

    // optimistic remove
    setFavorites((prev) => {
      const copy = { ...prev };
      delete copy[event.id];
      return copy;
    });

    const reAdd = (opts?: { showReaddedToast?: boolean }) => {
      setFavorites((prev) => ({ ...prev, [event.id]: removedEvent }));

      api.post("/favorites", removedEvent).catch((err) => {
        console.error("Failed to re-add favorite", err);
        toast.error(`Could not re-add ${event.name}.`);
      });

      if (opts?.showReaddedToast) {
        toast.success(`${event.name} re-added to favorites!`);
      }
    };

    // toast: "... removed from favorites!" with Undo
    toast(`${event.name} removed from favorites!`, {
      action: {
        label: "Undo",
        onClick: () => reAdd({ showReaddedToast: true }),
      },
    });

    // backend remove
    api.delete(`/favorites/${event.id}`).catch((err) => {
      console.error("Failed to remove favorite", err);
      // revert if backend failed (no “re-added” toast here)
      reAdd({ showReaddedToast: false });
      toast.error(`Could not remove ${event.name}.`);
    });
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export default function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used inside FavoritesProvider");
  }
  return ctx;
}
