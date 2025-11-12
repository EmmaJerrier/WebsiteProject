import { useNavigate } from "react-router-dom";

export interface EventSummary {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  genre: string;
  imageUrl: string;
}

interface Props {
  event: EventSummary;
}

export default function EventCard({ event }: Props) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/event/${event.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert("Favorite clicked (we'll wire this to MongoDB later!)");
  };

  return (
    <div
      className="grid grid-cols-[auto,auto,80px,1fr,1fr,auto] items-center gap-4 p-3 bg-white/5 border border-slate-700 rounded-xl hover:bg-white/10 cursor-pointer"
      onClick={handleClick}
    >
      <div className="text-xs px-2 py-1 rounded-full border border-slate-500">
        {event.genre || "N/A"}
      </div>

      <div className="text-sm text-gray-300">
        <div>{event.date}</div>
        <div>{event.time}</div>
      </div>

      <div className="w-20 h-20 overflow-hidden rounded-md bg-black/40 flex items-center justify-center">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs text-gray-500 text-center px-1">
            No image
          </span>
        )}
      </div>

      <div className="text-sm font-semibold">{event.name}</div>
      <div className="text-sm text-gray-300">{event.venue}</div>

      <button
        onClick={handleFavoriteClick}
        className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-500 hover:bg-slate-700"
        aria-label="Favorite"
      >
        <span className="text-lg">♡</span>
      </button>
    </div>
  );
}
