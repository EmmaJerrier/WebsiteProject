import { useState } from "react";
import api from "../api/client";
import EventCard from "../components/EventCard";
import type { EventSummary } from "../components/EventCard";


function getSegmentId(category: string): string | undefined {
  switch (category) {
    case "Music":
      return "KZFzniwnSyZfZ7v7nJ";
    case "Sports":
      return "KZFzniwnSyZfZ7v7nE";
    case "Arts & Theatre":
      return "KZFzniwnSyZfZ7v7na";
    case "Film":
      return "KZFzniwnSyZfZ7v7nn";
    case "Miscellaneous":
      return "KZFzniwnSyZfZ7v7n1";
    case "All":
    default:
      return undefined;
  }
}

async function getLatLngFromIpinfo(): Promise<{ lat: number; lng: number }> {
  const token = "YOUR_IPINFO_TOKEN_HERE"; // you already have your real token
  const res = await fetch(`https://ipinfo.io/json?token=${token}`);
  const data = await res.json();
  const [latStr, lngStr] = (data.loc ?? "34.0211,-118.2890").split(",");
  return { lat: Number(latStr), lng: Number(lngStr) };
}

async function getLatLngFromAddress(
  location: string
): Promise<{ lat: number; lng: number }> {
  const key = "YOUR_GOOGLE_GEOCODE_API_KEY_HERE"; // you already have your real key
  const encoded = encodeURIComponent(location);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${key}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("No geocoding results for that address");
  }

  const loc = data.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}

export default function SearchPage() {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("All");
  const [distance, setDistance] = useState("10");
  const [location, setLocation] = useState("");
  const [autoDetect, setAutoDetect] = useState(true);

  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!keyword.trim()) {
      alert("Please enter a keyword.");
      return;
    }

    if (!autoDetect && !location.trim()) {
      alert("Please enter a location or enable auto-detect.");
      return;
    }

    setLoading(true);
    setEvents([]);

    try {
      let coords: { lat: number; lng: number };
      if (autoDetect) {
        coords = await getLatLngFromIpinfo();
      } else {
        coords = await getLatLngFromAddress(location.trim());
      }

      const segmentId = getSegmentId(category);

      const res = await api.get("/events/search", {
        params: {
          keyword,
          radius: distance || "10",
          lat: coords.lat,
          lng: coords.lng,
          ...(segmentId ? { segmentId } : {})
        }
      });

      const eventsRaw = res.data?._embedded?.events ?? [];

      const mapped: EventSummary[] = eventsRaw.map((e: any) => ({
        id: e.id,
        name: e.name,
        date: e.dates?.start?.localDate ?? "",
        time: e.dates?.start?.localTime ?? "",
        venue: e._embedded?.venues?.[0]?.name ?? "",
        genre: e.classifications?.[0]?.segment?.name ?? "N/A",
        imageUrl: e.images?.[0]?.url ?? ""
      }));

      setEvents(mapped);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch events (check API keys / network).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <form
        onSubmit={handleSearch}
        className="space-y-4 border rounded-xl p-4 bg-white/5"
      >
        {/* Row 1: Keyword + Category */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm mb-1">
              Keyword<span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border rounded px-2 py-1 text-black"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Keyword"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">
              Category<span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border rounded px-2 py-1 text-black"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>All</option>
              <option>Music</option>
              <option>Sports</option>
              <option>Arts & Theatre</option>
              <option>Film</option>
              <option>Miscellaneous</option>
            </select>
          </div>
        </div>

        {/* Row 2: Distance + Location + Auto-detect */}
        <div className="grid gap-4 md:grid-cols-[1fr,2fr] items-end">
          <div>
            <label className="block text-sm mb-1">Distance</label>
            <div className="flex items-center gap-2">
              <input
                className="w-full border rounded px-2 py-1 text-black"
                type="number"
                min={0}
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
              <span className="text-sm text-gray-300">miles</span>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">
              Location{!autoDetect && <span className="text-red-500">*</span>}
            </label>
            <input
              className="w-full border rounded px-2 py-1 text-black disabled:bg-gray-200 disabled:text-gray-500"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter a location"
              disabled={autoDetect}
            />
            <label className="mt-2 inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoDetect}
                onChange={() => setAutoDetect((v) => !v)}
              />
              <span>Auto-detect location</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2 rounded bg-blue-600 text-white font-medium"
        >
          Search
        </button>
      </form>

      {loading && <div>Loading…</div>}

      {!loading && events.length === 0 && (
        <div className="text-sm text-gray-400">
          No results yet. Try a search.
        </div>
      )}

      {events.length > 0 && (
        <div className="space-y-2">
          {/* header row (desktop) */}
          <div className="hidden md:grid grid-cols-[auto,auto,80px,1fr,1fr,auto] gap-4 px-3 text-xs text-gray-400">
            <div>Category</div>
            <div>Date &amp; Time</div>
            <div>Image</div>
            <div>Event</div>
            <div>Venue</div>
            <div>Favorite</div>
          </div>

          <div className="space-y-2">
            {events.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
