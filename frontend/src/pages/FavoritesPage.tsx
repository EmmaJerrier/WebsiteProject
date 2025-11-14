import useFavorites from "../hooks/useFavorites";
import EventCard from "../components/EventCard";
import type { EventSummary } from "../components/EventCard";

export default function FavoritesPage() {
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  const favoritesList: EventSummary[] = Array.isArray(favorites)
    ? (favorites as EventSummary[])
    : favorites
    ? (Object.values(favorites) as EventSummary[])
    : [];

  return (
    <div className="px-8 py-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Favorites</h1>

      {favoritesList.length === 0 ? (
        <div className="text-sm text-gray-400">No favorite events yet.</div>
      ) : (
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoritesList.map((ev: EventSummary) => (
              <EventCard
                key={ev.id}
                event={ev}
                isFavorite={isFavorite(ev.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}