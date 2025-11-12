import useFavorites from "../hooks/useFavorites";
import EventCard from "../components/EventCard";
import type { EventSummary } from "../components/EventCard";

export default function FavoritesPage() {
  const { favorites, loading, isFavorite, toggleFavorite } = useFavorites();

  if (loading) {
    return <div>Loading favorites…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold mb-2">Favorites</h1>

      {favorites.length === 0 ? (
        <div className="text-sm text-gray-400">
          No favorite events yet.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="hidden md:grid grid-cols-[auto,auto,80px,1fr,1fr,auto] gap-4 px-3 text-xs text-gray-400">
            <div>Category</div>
            <div>Date &amp; Time</div>
            <div>Image</div>
            <div>Event</div>
            <div>Venue</div>
            <div>Favorite</div>
          </div>

          <div className="space-y-2">
            {favorites.map((ev: EventSummary) => (
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