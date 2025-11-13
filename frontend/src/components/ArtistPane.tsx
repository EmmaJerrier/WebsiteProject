import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getSpotifyArtist, getSpotifyArtistAlbums, findSpotifyArtistByName } from "../api/spotify";

type Props = { preferredName?: string; fallbackNames?: string[] };

export default function ArtistPane({ preferredName, fallbackNames = [] }: Props) {
  const [artist, setArtist] = useState<any | null>(null);
  const [albums, setAlbums] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  // choose the first name that resolves on Spotify
  useEffect(() => {
    let active = true;
    const tryNames = async () => {
      setLoading(true);
      const names = [preferredName, ...fallbackNames].filter(Boolean) as string[];
      let found: any | null = null;
      for (const n of names) {
        const a = await findSpotifyArtistByName(n);
        if (a) { found = a; break; }
      }
      if (active) setArtist(found);
      if (found) {
        const [full, discs] = await Promise.all([
          getSpotifyArtist(found.id),
          getSpotifyArtistAlbums(found.id),
        ]);
        if (!active) return;
        setArtist(full);
        // dedupe by name+release_date
        const seen = new Set<string>();
        const clean = discs.filter(d => {
          const key = `${d.name}|${d.release_date}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setAlbums(clean);
      }
      setLoading(false);
    };
    tryNames();
    return () => { active = false; };
  }, [preferredName, fallbackNames]);

  const avatar = artist?.images?.[0]?.url;
  const name = artist?.name;
  const followers = artist?.followers?.total ?? 0;
  const popularity = artist?.popularity ?? 0;
  const genres: string[] = artist?.genres ?? [];
  const spotifyUrl = artist?.external_urls?.spotify;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!artist) {
    return <div className="text-sm text-gray-600">No Spotify data found for this artist.</div>;
  }

  return (
    <div className="space-y-8">
      {/* artist header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
        <img
          src={avatar}
          alt={name}
          className="h-20 w-20 rounded-lg object-cover bg-gray-100"
        />
        <div className="flex-1">
          <div className="text-xl font-semibold">{name}</div>
          <div className="mt-1 text-sm text-gray-600">
            Followers: {followers.toLocaleString()} &nbsp;•&nbsp; Popularity: {popularity}%
          </div>
          {genres.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {genres.slice(0, 6).map((g) => (
                <Badge key={g} variant="secondary" className="rounded-full">
                  {g}
                </Badge>
              ))}
            </div>
          )}
          {spotifyUrl && (
            <div className="mt-3">
              <Button asChild variant="default" className="rounded-full">
                <a href={spotifyUrl} target="_blank" rel="noreferrer">Open in Spotify</a>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Albums */}
      <div>
        <div className="text-lg font-semibold mb-3">Albums</div>
        {(!albums || albums.length === 0) ? (
          <div className="text-sm text-gray-600">No albums found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {albums.map((al) => {
              const img = al.images?.[0]?.url;
              return (
                <div key={al.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <div className="h-56 w-full bg-gray-100">
                    {img ? (
                      <img src={img} alt={al.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold line-clamp-2">{al.name}</div>
                    <div className="mt-1 text-xs text-gray-600">
                      {al.release_date} • {al.total_tracks} tracks
                    </div>
                    {al.external_urls?.spotify && (
                      <div className="mt-2">
                        <a
                          href={al.external_urls.spotify}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-blue-600 underline"
                        >
                          View on Spotify
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
