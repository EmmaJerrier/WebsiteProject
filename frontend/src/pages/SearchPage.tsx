import { useEffect, useState, type FormEvent } from "react";
import api from "../api/client";
import KeywordAutocomplete from "../components/KeywordAutocomplete";
import EventCard from "../components/EventCard";
import type { EventSummary } from "../components/EventCard";
import useFavorites from "../hooks/useFavorites";
import { useSearch } from "../context/SearchContext";
import { useLocation } from "react-router-dom";

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
  const token = "6b472e47a439a3";
  const res = await fetch(`https://ipinfo.io/json?token=${token}`);
  const data = await res.json();
  const [latStr, lngStr] = (data.loc ?? "34.0211,-118.2890").split(",");
  return { lat: Number(latStr), lng: Number(lngStr) };
}

async function getLatLngFromAddress(
  location: string
): Promise<{ lat: number; lng: number }> {
  const key = "AIzaSyAvOtr2fUgllC0K4pxdy7cblNqYux5KB5o";
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

type FormErrors = {
  keyword?: string;
  location?: string;
};

export default function SearchPage() {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { consumeSearchState, saveSearchState } = useSearch();

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("All");
  const [distance, setDistance] = useState("10");
  const [location, setLocation] = useState("");
  const [autoDetect, setAutoDetect] = useState(true);

  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const routerLocation = useLocation();

  // Restore search state on mount if available
  useEffect(() => {
    // priority: location.state (history entry) -> context consume -> sessionStorage
  let savedState: any = (routerLocation.state as any)?.searchState ?? null;

  if (!savedState) savedState = consumeSearchState();

    // If context didn't have it yet (race), try sessionStorage directly
    if (!savedState) {
      try {
        const raw = sessionStorage.getItem("searchState");
        if (raw) {
          savedState = JSON.parse(raw) as any;
          // remove after reading to avoid reuse
          sessionStorage.removeItem("searchState");
          console.debug("SearchPage: restored state from sessionStorage", savedState);
        }
      } catch (e) {
        console.warn("SearchPage: failed to read sessionStorage", e);
      }
    }

    if (savedState) {
      setKeyword(savedState.keyword);
      setCategory(savedState.category);
      setDistance(savedState.distance);
      setLocation(savedState.location);
      setAutoDetect(savedState.autoDetect);
      setEvents(savedState.events);

      // Restore scroll position after a short delay to ensure DOM is updated
      setTimeout(() => {
        window.scrollTo(0, savedState.scrollPosition);
      }, 50);
    }
  }, [consumeSearchState, routerLocation]);

  useEffect(() => {
    if (autoDetect) {
      setLocation("");
      setErrors((prev) => ({ ...prev, location: undefined }));
    }
  }, [autoDetect]);

  const saveState = () => {
    // Save current search state so it can be restored after navigating back
    const state = {
      keyword,
      category,
      distance,
      location,
      autoDetect,
      events,
      scrollPosition: window.scrollY,
    };
    saveSearchState(state);
    // Also write the search state into the current history entry so that
    // navigating back (history back) will have the state available on the
    // Search entry (location.state)
    try {
      const current = window.history.state || {};
      const next = { ...current, searchState: state };
      window.history.replaceState(next, document.title);
    } catch (e) {
      console.warn("SearchPage: failed to replace history state", e);
    }
    return state;
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {};

    if (!keyword.trim()) {
      newErrors.keyword = "Please enter some keywords";
    }

    if (!autoDetect && !location.trim()) {
      newErrors.location = "Please enter a location or turn on auto-detect";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return; // stop if invalid
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
      console.error("Search error:", err);
      
      // Provide detailed error messages for debugging
      let errorMsg = "Failed to fetch events";
      
      if (err instanceof TypeError && err.message.includes("fetch")) {
        errorMsg = "Network error: Cannot connect to backend. Is the backend running on http://localhost:8080?";
      } else if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === "object" && err !== null && "response" in err) {
        const axiosErr = err as any;
        errorMsg = `Backend error (${axiosErr.response?.status}): ${axiosErr.response?.data?.error || axiosErr.message}`;
      }
      
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-8 py-6 max-w-6xl mx-auto">
      {/* Search form */}
      <form onSubmit={handleSearch} className="space-y-5 w-full">
        {/* SINGLE ROW LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start w-full">
          {/* Keywords */}
          <div className="w-full">
            <label
              className={`block text-sm font-semibold mb-1 ${
                errors.keyword ? "text-red-600" : "text-gray-800"
              }`}
            >
              Keywords <span className="text-red-500">*</span>
            </label>

            <div
              className={`rounded border bg-white ${
                errors.keyword ? "border-red-500" : "border-gray-300"
              }`}
            >
              <KeywordAutocomplete
                value={keyword}
                onChange={(v) => {
                  setKeyword(v);
                  if (errors.keyword) {
                    setErrors((prev) => ({ ...prev, keyword: undefined }));
                  }
                }}
                placeholder="Start typing to search…"
              />
            </div>

            {errors.keyword && (
              <p className="mt-1 text-xs text-red-600">{errors.keyword}</p>
            )}
          </div>

          {/* Category */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-1 text-gray-800">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Location + toggle */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-1">
              <span
                className={`text-sm font-semibold ${
                  errors.location ? "text-red-600" : "text-gray-800"
                }`}
              >
                Location
                {!autoDetect && <span className="text-red-500">*</span>}
              </span>
              <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={autoDetect}
                  onChange={() => {
                    setAutoDetect((v) => !v);
                    setErrors((prev) => ({ ...prev, location: undefined }));
                  }}
                />
                <span>Auto-detect</span>
              </label>
            </div>

            <input
              className={`w-full rounded px-3 py-2 text-black disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:ring-2 ${
                errors.location
                  ? "border border-red-500 focus:ring-red-500"
                  : "border border-gray-300 focus:ring-blue-500"
              }`}
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                if (errors.location) {
                  setErrors((prev) => ({ ...prev, location: undefined }));
                }
              }}
              placeholder="Enter a location"
              disabled={autoDetect}
            />

            {errors.location && (
              <p className="mt-1 text-xs text-red-600">{errors.location}</p>
            )}
          </div>

          {/* Distance */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-1 text-gray-800">
              Distance
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                className="w-full border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
              <span className="text-sm text-gray-600">miles</span>
            </div>
          </div>

        <div className="w-full">
        <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2 rounded bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-60 border border-black"
        >
            Search Events
        </button>
        </div>
        </div>

      </form>

      {/* Results */}
      <div className="mt-8">
        {loading && <div className="text-gray-500">Loading…</div>}

        {!loading && events.length === 0 && (
          <div className="text-sm text-gray-500">
            No results yet. Try a search.
          </div>
        )}

        {events.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                isFavorite={isFavorite(ev.id)}
                onToggleFavorite={toggleFavorite}
                onBeforeNavigate={saveState}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
