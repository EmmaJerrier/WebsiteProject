import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

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
    const d = dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const t = dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    return hasTime ? `${d}, ${t}` : d;
  } catch {
    return date || "";
  }
}

export default function EventCard({ event, isFavorite, onToggleFavorite }: Props) {
  const navigate = useNavigate();

  const badgeDate = useMemo(() => formatBadgeDate(event.date, event.time), [event.date, event.time]);

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
            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No image</div>
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
            aria-label="favorite"
          >
            <span className={`text-base leading-none ${isFavorite ? "text-red-500" : "text-gray-700"}`}>
              {isFavorite ? "♥" : "♡"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
