import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

// Shared event shape used across search, details, favorites, etc.
export interface EventSummary {
  id: string;
  name: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM:SS" (local)
  venue: string;
  genre: string; // e.g., "Sports"
  imageUrl: string;
}

interface Props {
  event: EventSummary;
  isFavorite: boolean;
  onToggleFavorite: (event: EventSummary) => void;
}

function formatBadgeDate(date: string, time: string) {
  // e.g., "Oct 10, 06:30 PM" or just "Oct 10"
  try {
    const dt = new Date(`${date}T${time || "00:00:00"}`);
    const hasTime = Boolean(time);
    const d = dt.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const t = dt.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return hasTime ? `${d}, ${t}` : d;
  } catch {
    return date || "";
  }
}

export default function EventCard({ event, isFavorite, onToggleFavorite }: Props) {
  const navigate = useNavigate();

  const badgeDate = useMemo(
    () => formatBadgeDate(event.date, event.time),
    [event.date, event.time]
  );

  const goDetail = () => navigate(`/event/${event.id}`);

  const onFavClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(event);
  };

  return (
    <div
      onClick={goDetail}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
    >
      {/* Image */}
      <div className="relative bg-gray-100">
        <div className="h-44 md:h-48 w-full overflow-hidden">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
              No image
            </div>
          )}
        </div>

        {/* Top-left: genre chip */}
        {event.genre && (
          <span className="absolute left-2 top-2 rounded-full border border-gray-300 bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-700 backdrop-blur">
            {event.genre}
          </span>
        )}

        {/* Top-right: date chip */}
        {badgeDate && (
          <span className="absolute right-2 top-2 rounded-full border border-gray-300 bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-700 backdrop-blur">
            {badgeDate}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="line-clamp-2 text-sm font-semibold text-gray-900">
          {event.name}
        </div>
        <div className="mt-1 text-xs text-gray-600">{event.venue}</div>

        {/* Actions */}
        <div className="mt-3 flex items-center justify-end">
          <button
            onClick={onFavClick}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {/* Heart icon: outline when not favorite, red filled when favorite */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              className={isFavorite ? "text-red-500" : "text-black"}
            >
              <path
                d="M12.1 4.44 12 4.55l-.1-.11A5.46 5.46 0 0 0 7.5 2 5.5 5.5 0 0 0 2 7.5c0 1.61.64 3.09 1.76 4.21l7.07 7.07a1 1 0 0 0 1.41 0l7.07-7.07A5.96 5.96 0 0 0 22 7.5 5.5 5.5 0 0 0 16.5 2a5.46 5.46 0 0 0-4.4 2.44Z"
                fill={isFavorite ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
