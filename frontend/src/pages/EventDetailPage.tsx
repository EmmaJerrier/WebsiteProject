import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client";

interface EventDetails {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  genres: string;
  priceRange?: string;
  ticketStatus?: string;
  ticketUrl?: string;
  seatmapUrl?: string;
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchDetails() {
      try {
        const res = await api.get(`/events/${id}`);
        const e = res.data;

        const start = e.dates?.start ?? {};
        const venueObj = e._embedded?.venues?.[0];
        const price = e.priceRanges?.[0];
        const status = e.dates?.status?.code;

        const segments: string[] = [];
        const cls = e.classifications?.[0];
        if (cls?.segment?.name) segments.push(cls.segment.name);
        if (cls?.genre?.name) segments.push(cls.genre.name);
        if (cls?.subGenre?.name) segments.push(cls.subGenre.name);
        if (cls?.type?.name) segments.push(cls.type.name);
        if (cls?.subType?.name) segments.push(cls.subType.name);

        setEvent({
          id: e.id,
          name: e.name,
          date: start.localDate ?? "",
          time: start.localTime ?? "",
          venue: venueObj?.name ?? "",
          genres: segments.join(" | "),
          priceRange:
            price?.min && price?.max && price?.currency
              ? `${price.min} - ${price.max} ${price.currency}`
              : undefined,
          ticketStatus: status,
          ticketUrl: e.url,
          seatmapUrl: e.seatmap?.staticUrl
        });
      } catch (err) {
        console.error(err);
        alert("Failed to load event details");
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [id]);

  const handleBack = () => {
    // For now just go back in history
    navigate(-1);
  };

  if (loading) {
    return <div className="text-white">Loading event details…</div>;
  }

  if (!event) {
    return <div className="text-red-400">Event not found.</div>;
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleBack}
        className="text-sm text-blue-400 hover:underline"
      >
        &larr; Back to search
      </button>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{event.name}</h1>
        <div className="text-sm text-gray-300">
          {event.date} {event.time}
        </div>
        <div className="text-sm text-gray-300">{event.venue}</div>
      </div>

      <div className="border rounded-xl p-4 bg-white/5 space-y-2">
        {event.genres && (
          <div>
            <span className="font-semibold">Genres: </span>
            <span>{event.genres}</span>
          </div>
        )}
        {event.priceRange && (
          <div>
            <span className="font-semibold">Price Ranges: </span>
            <span>{event.priceRange}</span>
          </div>
        )}
        {event.ticketStatus && (
          <div>
            <span className="font-semibold">Ticket Status: </span>
            <span>{event.ticketStatus}</span>
          </div>
        )}
        {event.ticketUrl && (
          <div>
            <span className="font-semibold">Buy Tickets: </span>
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 underline"
            >
              Ticketmaster
            </a>
          </div>
        )}
        {event.seatmapUrl && (
          <div className="mt-2">
            <span className="font-semibold block mb-1">Seat Map:</span>
            <img
              src={event.seatmapUrl}
              alt="Seat map"
              className="max-w-full rounded-lg border border-slate-700"
            />
          </div>
        )}
      </div>
    </div>
  );
}
