import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../api/client";
import useFavorites from "../hooks/useFavorites";
import { useSearch } from "../context/SearchContext";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { EventSummary } from "../components/EventCard";
import ArtistPane from "../components/ArtistPane";


type TMAttraction = {
  id: string;
  name: string;
  url?: string;
  images?: { url: string }[];
  classifications?: { segment?: { name?: string }, genre?: { name?: string }, subGenre?: { name?: string } }[];
};

type TMVenue = {
  id: string;
  name?: string;
  url?: string;
  city?: { name?: string };
  state?: { name?: string };
  country?: { name?: string };
  postalCode?: string;
  address?: { line1?: string; line2?: string };
  location?: { longitude?: string; latitude?: string };
  boxOfficeInfo?: { openHoursDetail?: string; phoneNumberDetail?: string; willCallDetail?: string };
  generalInfo?: { generalRule?: string; childRule?: string };
  parkingDetail?: string;
};

type TMEvent = {
  id: string;
  name: string;
  url?: string; // buy tickets
  dates?: {
    start?: { localDate?: string; localTime?: string };
    status?: { code?: string };
  };
  priceRanges?: { min?: number; max?: number; currency?: string }[];
  seatmap?: { staticUrl?: string };
  classifications?: { segment?: { name?: string }, genre?: { name?: string }, subGenre?: { name?: string } }[];
  images?: { url: string }[];
  _embedded?: {
    attractions?: TMAttraction[];
    venues?: TMVenue[];
  };
};
function toSummary(e: TMEvent): EventSummary {
  const venueName = e._embedded?.venues?.[0]?.name ?? "";
  const imageUrl = e.images?.[0]?.url ?? e.seatmap?.staticUrl ?? "";
  const date = e.dates?.start?.localDate ?? "";
  const time = e.dates?.start?.localTime ?? "";
  const seg = e.classifications?.[0]?.segment?.name ?? "";
  const genre = seg || "N/A";

  return {
    id: e.id,
    name: e.name,
    date,
    time,
    venue: venueName,
    genre,
    imageUrl,
  };
}

function fmtDateTime(date?: string, time?: string) {
  if (!date && !time) return "";
  try {
    const dt = new Date(`${date ?? ""}T${time ?? "00:00:00"}`);
    const d = dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const t = time ? dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "";
    return t ? `${d}, ${t}` : d;
  } catch {
    return [date, time].filter(Boolean).join(" ");
  }
}

function formatVenueAddress(v?: {
  address?: { line1?: string; line2?: string };
  city?: { name?: string };
  state?: { name?: string };
  postalCode?: string;
  country?: { name?: string };
}) {
  if (!v) return "";
  const lineA = [v.address?.line1, v.address?.line2].filter(Boolean).join(", ");
  const lineB = [v.city?.name, v.state?.name, v.postalCode].filter(Boolean).join(", ");
  const lineC = v.country?.name || "";
  return [lineA, lineB, lineC].filter(Boolean).join(", ");
}


function genrePath(c?: TMEvent["classifications"]) {
  if (!c || !c[0]) return "";
  const seg = c[0].segment?.name ?? "";
  const g = c[0].genre?.name ?? "";
  const sg = c[0].subGenre?.name ?? "";
  return [seg, g, sg].filter(Boolean).join(", ");
}

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { clearSearchState } = useSearch();

  const [event, setEvent] = useState<TMEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/events/${id}`);
        if (active) setEvent(res.data);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const location = useLocation();

  const handleBack = () => {
    const locState = location.state as any;
    if (locState?.fromSearch) {
      if (locState.searchState) {
        navigate("/search", { state: { searchState: locState.searchState } });
        return;
      }
      navigate(-1);
      return;
    }

    // Otherwise clear any preserved state and go to a fresh search page
    clearSearchState();
    navigate("/search");
  };

  // Check if attractions contain music artists
  const hasMusicArtists = (event?._embedded?.attractions ?? []).some(
    (a) => a?.classifications?.[0]?.segment?.name === "Music"
  );

  const venue = event?._embedded?.venues?.[0];
  const attractions = event?._embedded?.attractions ?? [];
  const dateText = useMemo(
    () => fmtDateTime(event?.dates?.start?.localDate, event?.dates?.start?.localTime),
    [event?.dates?.start?.localDate, event?.dates?.start?.localTime]
  );
  const artistsLine = attractions.map(a => a.name).join(", ");
  const genres = genrePath(event?.classifications);
  const status = event?.dates?.status?.code ?? "";
  const priceText = (() => {
    const pr = event?.priceRanges?.[0];
    if (!pr) return "";
    const lo = pr.min != null ? pr.min.toFixed(2) : "";
    const hi = pr.max != null ? pr.max.toFixed(2) : "";
    const cur = pr.currency ?? "";
    return lo && hi ? `${lo}–${hi} ${cur}` : lo ? `${lo} ${cur}` : "";
  })();

  if (loading) {
    return (
      <div className="px-8 py-6 space-y-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-9 w-80" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }
  if (!event) return <div className="px-8 py-6">Not found.</div>;
    const attractionNames =
    (event?._embedded?.attractions ?? [])
        .map(a => a?.name)
        .filter(Boolean) as string[];

    // Prefer the first “Music” attraction as the main name if possible
    const musicFirst =
    (event?._embedded?.attractions ?? [])
        .filter(a => a?.classifications?.[0]?.segment?.name === "Music")
        .map(a => a.name)
        .filter(Boolean) as string[];

    const preferred = musicFirst[0] || attractionNames[0];
    const fallbacks = attractionNames.slice(1);

  return (
    <div className="px-8 py-6">
      {/* Top bar: Back link */}
      <div className="mb-3">
        <button
          onClick={handleBack}
          className="text-sm text-gray-600 hover:underline inline-flex items-center gap-2"
        >
          {/* back chevron */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Search
        </button>
      </div>

      {/* Title + actions row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{event.name}</h1>
        <div className="flex items-center gap-2">
          {event.url && (
            <Button asChild className="rounded-full">
              <a href={event.url} target="_blank" rel="noreferrer">Buy Tickets</a>
            </Button>
          )}
          {/* favorite heart */}
<button
  onClick={() => toggleFavorite(toSummary(event))}
  className="h-10 w-10 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center"
  aria-label={isFavorite(event.id) ? "Remove from favorites" : "Add to favorites"}
>
  <span className={isFavorite(event.id) ? "text-red-500 text-lg" : "text-black text-lg"}>
    {isFavorite(event.id) ? "♥" : "♡"}
  </span>
</button>


        </div>
      </div>

      {/* Tabs header (Info | Artists/Teams | Venue) */}
      <Tabs defaultValue="info" className="mt-4 w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="artists" disabled={!hasMusicArtists}>
            Artists/Teams
          </TabsTrigger>
          <TabsTrigger value="venue">Venue</TabsTrigger>
        </TabsList>

        {/* ---------- INFO TAB ---------- */}
        <TabsContent value="info" className="mt-4">
          {/* two-column: left info list, right seatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN */}
            <div className="space-y-5">
              {/* Date (only if present) */}
              {dateText && (
                <div>
                  <div className="text-sm font-semibold text-gray-900">Date</div>
                  <div className="text-gray-700">{dateText}</div>
                </div>
              )}

              {/* Artist/Team (only if present) */}
              {artistsLine && (
                <div>
                  <div className="text-sm font-semibold text-gray-900">Artist/Team</div>
                  <div className="text-gray-700">{artistsLine}</div>
                </div>
              )}

              {/* Venue (only if present) */}
              {venue?.name && (
                <div>
                  <div className="text-sm font-semibold text-gray-900">Venue</div>
                  <div className="text-gray-700">{venue.name}</div>
                </div>
              )}

              {/* Genres (only if present) */}
              {genres && (
                <div>
                  <div className="text-sm font-semibold text-gray-900">Genres</div>
                  <div className="text-gray-700">{genres}</div>
                </div>
              )}

              {/* Ticket Status (only if present) */}
              {status && (
                <div>
                  <div className="text-sm font-semibold text-gray-900">Ticket Status</div>
                  <div className="mt-1">
                    {/* Color the status: onsale=green, off sale=red, canceled=black, else=orange */}
                    {(() => {
                      const s = (status || "").toLowerCase();
                      let cls = "rounded-full border px-2 py-0.5 text-sm font-medium ";
                      if (s.includes("onsale") || s.includes("on sale")) {
                        cls += "bg-green-100 text-green-800 border-green-200";
                      } else if (s.includes("off") && s.includes("sale") || s.includes("offsale") || s === "offsale") {
                        cls += "bg-red-100 text-red-800 border-red-200";
                      } else if (s.includes("cancel")) {
                        cls += "bg-black text-white border-black";
                      } else {
                        cls += "bg-orange-100 text-orange-800 border-orange-200";
                      }
                      return (
                        <Badge className={cls}>
                          {status.replace(/([A-Z])/g, " $1").trim()}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Price (only if present) */}
              {priceText && (
                <div>
                  <div className="text-sm font-semibold text-gray-900">Price Range</div>
                  <div className="text-gray-700">{priceText}</div>
                </div>
              )}

              {/* Only show separator and share if we have content and can share */}
              {(dateText || artistsLine || venue?.name || genres || status || priceText) && (event.url || true) && (
                <>
                  <Separator />

                  {/* Share (icons only, like figure) */}
                  <div>
                    <div className="text-sm font-semibold text-gray-900 mb-2">Share</div>
                    <div className="flex gap-2">
                      <a
                        className="h-9 w-9 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(event.url ?? window.location.href)}`}
                        aria-label="Share on Facebook"
                      >
                        {/* fb icon */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.3V12h2.3V9.7c0-2.3 1.3-3.6 3.4-3.6.98 0 2 .18 2 .18v2.2h-1.1c-1.1 0-1.4.7-1.4 1.4V12h2.5l-.4 2.9h-2.1v7A10 10 0 0 0 22 12z"/>
                        </svg>
                      </a>
                      <a
                        className="h-9 w-9 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(event.url ?? window.location.href)}&text=${encodeURIComponent(event.name)}`}
                        aria-label="Share on X"
                      >
                        {/* x icon */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18 2h3l-7.5 8.6L22 22h-6l-4.7-6.6L5 22H2l8.1-9.3L2 2h6l4.3 6.1L18 2z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* RIGHT COLUMN - Seatmap / Hero image */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              {event.seatmap?.staticUrl || event.images?.[0]?.url ? (
                <img
                  src={event.seatmap?.staticUrl ?? event.images![0].url}
                  alt="Seatmap"
                  className="w-full h-[420px] object-contain bg-white"
                />
              ) : (
                <div className="h-[420px] w-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                  No seatmap available
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ---------- ARTISTS/TEAMS TAB (placeholder; you can fill with cards later) ---------- */}
        <TabsContent value="artists" className="mt-4">
        <ArtistPane preferredName={preferred} fallbackNames={fallbacks} />
        </TabsContent>

        {/* ---------- VENUE TAB (quick details; flesh out as needed) ---------- */}
<TabsContent value="venue" className="mt-4">
  {!venue ? (
    <div className="text-sm text-gray-700">No venue data.</div>
  ) : (
    <div className="space-y-4">
      {/* Top row: Venue name + address + See Events (only if venue has data) */}
      {(venue.name || formatVenueAddress(venue)) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {/* Name (only if present) */}
            {venue.name && (
              <div className="text-2xl font-semibold leading-tight">
                {venue.name}
              </div>
            )}

            {/* Address (only if present) */}
            {(() => {
              const addressText = formatVenueAddress(venue);
              const lat = venue.location?.latitude;
              const lng = venue.location?.longitude;
              const hasCoords = lat && lng;

              if (!addressText) return null;

              const mapsUrl = hasCoords
                ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                : "";

              return (
                <div className="mt-1 text-sm text-gray-600">
                  {hasCoords ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:text-blue-600 underline"
                    >
                      {addressText}
                      {/* small external icon */}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M14 3h7v7m0-7L10 14"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21 14v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  ) : (
                    <span>{addressText}</span>
                  )}
                </div>
              );
            })()}
          </div>

          {venue.url && (
            <Button
              asChild
              className="rounded-full"
              variant="outline"
            >
              <a
                href={venue.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                See Events
                <svg
                  className="ml-2"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M14 3h7v7m0-7L10 14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </Button>
          )}
        </div>
      )}

      {/* Two-column content (only show if there's content to display) */}
      {((venue as any).images?.[0]?.url || venue.parkingDetail || venue.generalInfo?.generalRule || venue.generalInfo?.childRule) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Cover / logo (only if there is an image) */}
          {((venue as any).images?.[0]?.url) && (
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
              <img
                src={(venue as any).images[0].url}
                alt={venue.name ?? "Venue"}
                className="w-full h-[360px] object-contain bg-white"
              />
            </div>
          )}

          {/* Right: Parking / Rules – each only if present */}
          <div className="space-y-6 text-sm">
            {venue.parkingDetail && (
              <div>
                <div className="font-semibold text-gray-900 mb-1">Parking</div>
                <div className="text-gray-700 whitespace-pre-line">
                  {venue.parkingDetail}
                </div>
              </div>
            )}

            {venue.generalInfo?.generalRule && (
              <div>
                <div className="font-semibold text-gray-900 mb-1">General Rule</div>
                <div className="text-gray-700 whitespace-pre-line">
                  {venue.generalInfo.generalRule}
                </div>
              </div>
            )}

            {venue.generalInfo?.childRule && (
              <div>
                <div className="font-semibold text-gray-900 mb-1">Child Rule</div>
                <div className="text-gray-700 whitespace-pre-line">
                  {venue.generalInfo.childRule}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )}
</TabsContent>

      </Tabs>
    </div>
  );
}
