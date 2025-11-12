import { useEffect, useState } from "react";
import api from "../api/client";
import KeywordAutocomplete from "../components/KeywordAutocomplete";
import EventCard from "../components/EventCard";
import type { EventSummary } from "../components/EventCard";
import useFavorites from "../hooks/useFavorites";

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
    default:
      return undefined;
  }
}

async function getLatLngFromIpinfo(): Promise<{ lat: number; lng: number }> {
  const token = "YOUR_IPINFO_TOKEN_HERE";
  const res = await fetch(`https://ipinfo.io/json?token=${token}`);
  const data = await res.json();
  const [latStr, lngStr] = (data.loc ?? "34.0211,-118.2890").split(",");
  return { lat: Number(latStr), lng: Number(lngStr) };
}

async function getLatLngFromAddress(
  location: string
): Promise<{ lat: number; lng: number }> {
  const key = "YOUR_GOOGLE_GEOCODE_API_KEY_HERE";
  const encoded = encodeURIComponent(location);
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${key}`
  );
  const data = await res.json();
  if (!data.results || data.results.length === 0)
    throw new Error("No geocoding results for that address");
  const loc = data.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}

export default function SearchPage() {
  const { isFavorite, toggleFavorite } = useFavorites();

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("All");
  const [distance, setDistance] = useState("10");
  const [location, setLocation] = useState("");
  const [autoDetect, setAutoDetect] = useState(true);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (autoDetect) setLocation("");
  }, [autoDetect]);

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
      coords = autoDetect
        ? await getLatLngFromIpinfo()
        : await getLatLngFromAddress(location.trim());

      const segmentId = getSegmentId(category);
      const res = await api.get("/events/search", {
        params: {
          keyword,
          radius: distance || "10",
          lat: coords.lat,
          lng: coords.lng,
          ...(segmentId ? { segmentId } : {}),
        },
      });

      const eventsRaw = res.data?._embedded?.events ?? [];
      const mapped: EventSummary[] = eventsRaw.map((e: any) => ({
        id: e.id,
        name: e.name,
        date: e.dates?.start?.localDate ?? "",
        time: e.dates?.start?.localTime ?? "",
        venue: e._embedded?.venues?.[0]?.name ?? "",
        genre: e.classifications?.[0]?.segment?.name ?? "N/A",
        imageUrl: e.images?.[0]?.url ?? "",
      }));
      setEvents(mapped);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch events (check API keys / network).");
    } finally {
      setLoading(false);
    }
  };

  // ---------- LAYOUT ----------
return (
  <div className="px-8 py-6">  {/* simple padding, no background, no max-w */}
    {/* Full-width single-row form */}
    <form onSubmit={handleSearch} className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Keywords (3) */}
        <div className="md:col-span-3">
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            Keywords <span className="text-red-500">*</span>
          </label>
          <KeywordAutocomplete
            value={keyword}
            onChange={setKeyword}
            placeholder="Start typing to search…"
          />
        </div>

        {/* Category (2) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
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

        {/* Location (3) */}
        <div className="md:col-span-3">
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            Location {!autoDetect && <span className="text-red-500">*</span>}
          </label>
          <input
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter a location"
            disabled={autoDetect}
          />
        </div>

        {/* Auto-detect (2) */}
        <div className="md:col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoDetect}
            onChange={() => setAutoDetect((v) => !v)}
            className="h-4 w-4 accent-blue-600"
          />
          <label className="text-sm font-semibold text-gray-800">Auto-detect location</label>
        </div>

        {/* Distance (1) */}
        <div className="md:col-span-1">
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            Distance <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-sm text-gray-600">miles</span>
          </div>
        </div>

        {/* Submit (1) */}
        <div className="md:col-span-1">
          <label className="block text-sm font-semibold text-gray-800 mb-1 opacity-0">Search</label>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded bg-black text-white font-semibold hover:bg-gray-800"
          >
            Search
          </button>
        </div>
      </div>
    </form>

{/* Results */}
{loading && <div className="text-gray-500">Loading…</div>}

{!loading && events.length === 0 && (
  <div className="text-sm text-gray-500">No results yet. Try a search.</div>
)}

{events.length > 0 && (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {events.map((ev) => (
      <EventCard
        key={ev.id}
        event={ev}
        isFavorite={isFavorite(ev.id)}
        onToggleFavorite={toggleFavorite}
      />
    ))}
  </div>
)}

    </div>

);

}
