import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/client";
import useFavorites from "../hooks/useFavorites";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { EventSummary } from "../components/EventCard";

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

  return (
    <div className="px-8 py-6">
      {/* Top bar: Back link */}
      <div className="mb-3">
        <button
          onClick={() => navigate(-1)}
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
        aria-label="favorite"
        title="Favorite"
        >
        <span className={`text-lg ${isFavorite(event.id) ? "text-red-500" : "text-gray-800"}`}>
            {isFavorite(event.id) ? "♥" : "♡"}
        </span>
        </button>

        </div>
      </div>

      {/* Tabs header (Info | Artists/Teams | Venue) */}
      <Tabs defaultValue="info" className="mt-4">
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="artists">Artists/Teams</TabsTrigger>
          <TabsTrigger value="venue">Venue</TabsTrigger>
        </TabsList>

        {/* ---------- INFO TAB ---------- */}
        <TabsContent value="info" className="mt-4">
          {/* two-column: left info list, right seatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN */}
            <div className="space-y-5">
              {/* Date */}
              <div>
                <div className="text-sm font-semibold text-gray-900">Date</div>
                <div className="text-gray-700">{dateText || "—"}</div>
              </div>

              {/* Artist/Team */}
              <div>
                <div className="text-sm font-semibold text-gray-900">Artist/Team</div>
                <div className="text-gray-700">{artistsLine || "—"}</div>
              </div>

              {/* Venue */}
              <div>
                <div className="text-sm font-semibold text-gray-900">Venue</div>
                <div className="text-gray-700">{venue?.name || "—"}</div>
              </div>

              {/* Genres */}
              <div>
                <div className="text-sm font-semibold text-gray-900">Genres</div>
                <div className="text-gray-700">{genres || "—"}</div>
              </div>

              {/* Ticket Status */}
              <div>
                <div className="text-sm font-semibold text-gray-900">Ticket Status</div>
                <div className="mt-1">
                  {status ? (
                    <Badge
                      className="rounded-full"
                      variant={status.toLowerCase() === "onsale" || status.toLowerCase() === "on sale" ? "secondary" : "outline"}
                    >
                      {status.replace(/([A-Z])/g, " $1").trim()}
                    </Badge>
                  ) : "—"}
                </div>
              </div>

              {/* Price */}
              <div>
                <div className="text-sm font-semibold text-gray-900">Price Range</div>
                <div className="text-gray-700">{priceText || "—"}</div>
              </div>

              <Separator />

              {/* Share (icons only, like figure) */}
              <div>
                <div className="text-sm font-semibold text-gray-900 mb-2">Share</div>
                <div className="flex gap-2">
                  <a
                    className="h-9 w-9 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(event.url ?? location.href)}`}
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
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(event.url ?? location.href)}&text=${encodeURIComponent(event.name)}`}
                    aria-label="Share on X"
                  >
                    {/* x icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 2h3l-7.5 8.6L22 22h-6l-4.7-6.6L5 22H2l8.1-9.3L2 2h6l4.3 6.1L18 2z"/>
                    </svg>
                  </a>
                </div>
              </div>
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
          <div className="text-sm text-gray-700">
            {artistsLine || "No artists/teams listed."}
          </div>
        </TabsContent>

        {/* ---------- VENUE TAB (quick details; flesh out as needed) ---------- */}
        <TabsContent value="venue" className="mt-4">
          {!venue ? (
            <div className="text-sm text-gray-700">No venue data.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              <div className="space-y-3">
                <div>
                  <div className="font-semibold text-gray-900">Name</div>
                  <div className="text-gray-700">{venue.name ?? "—"}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Address</div>
                  <div className="text-gray-700">
                    {[venue.address?.line1, venue.address?.line2].filter(Boolean).join(", ") || "—"}
                    <br />
                    {[venue.city?.name, venue.state?.name, venue.postalCode].filter(Boolean).join(", ") || ""}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Phone</div>
                  <div className="text-gray-700">{venue.boxOfficeInfo?.phoneNumberDetail || "—"}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="font-semibold text-gray-900">General Rules</div>
                  <div className="text-gray-700 whitespace-pre-line">{venue.generalInfo?.generalRule || "—"}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Child Rules</div>
                  <div className="text-gray-700 whitespace-pre-line">{venue.generalInfo?.childRule || "—"}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Parking</div>
                  <div className="text-gray-700 whitespace-pre-line">{venue.parkingDetail || "—"}</div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
