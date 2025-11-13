import api from "./client";

export async function findSpotifyArtistByName(name: string) {
  const { data } = await api.get("/spotify/lookup", { params: { name } });
  return data.artist as any | null;
}

export async function getSpotifyArtist(artistId: string) {
  const { data } = await api.get(`/spotify/artist/${artistId}`);
  return data as any;
}

export async function getSpotifyArtistAlbums(artistId: string) {
  const { data } = await api.get(`/spotify/artist/${artistId}/albums`);
  return data.items as any[];
}
