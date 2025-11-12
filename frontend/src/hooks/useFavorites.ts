import { useEffect, useState } from "react";
import api from "../api/client";
import type { EventSummary } from "../components/EventCard";

interface UseFavoritesReturn {
  favorites: EventSummary[];
  loading: boolean;
  isFavorite: (eventId: string) => boolean;
  toggleFavorite: (event: EventSummary) => Promise<void>;
}

export default function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchFavorites() {
      try {
        setLoading(true);
        const res = await api.get("/favorites");
        const data = res.data as any[];

        const mapped: EventSummary[] = data.map((f) => ({
          id: f.eventId,
          name: f.name,
          date: f.date,
          time: f.time,
          venue: f.venue,
          genre: f.genre,
          imageUrl: f.imageUrl
        }));

        setFavorites(mapped);
      } catch (err) {
        console.error("Failed to load favorites", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, []);

  const isFavorite = (eventId: string): boolean =>
    favorites.some((f) => f.id === eventId);

  const toggleFavorite = async (event: EventSummary) => {
    try {
      if (isFavorite(event.id)) {
        // Remove from favorites
        await api.delete(`/favorites/${event.id}`);
        setFavorites((prev) => prev.filter((f) => f.id !== event.id));
      } else {
        // Add to favorites
        await api.post("/favorites", {
          eventId: event.id,
          name: event.name,
          date: event.date,
          time: event.time,
          venue: event.venue,
          genre: event.genre,
          imageUrl: event.imageUrl
        });
        setFavorites((prev) => [event, ...prev]);
      }
    } catch (err) {
      console.error("Failed to toggle favorite", err);
      alert("Could not update favorites. Please try again.");
    }
  };

  return { favorites, loading, isFavorite, toggleFavorite };
}
