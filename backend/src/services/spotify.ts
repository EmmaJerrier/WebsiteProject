import axios from "axios";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API = "https://api.spotify.com/v1";

let accessToken = "";
let expiresAt = 0; // epoch ms

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (accessToken && now < expiresAt - 5_000) return accessToken;

  const id = process.env.SPOTIFY_CLIENT_ID!;
  const secret = process.env.SPOTIFY_CLIENT_SECRET!;
  if (!id || !secret) throw new Error("Missing SPOTIFY_CLIENT_ID/SECRET");

  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const form = new URLSearchParams({ grant_type: "client_credentials" });

  const { data } = await axios.post(
    TOKEN_URL,
    form.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${auth}` } }
  );

  accessToken = data.access_token;
  // data.expires_in is seconds
  expiresAt = now + data.expires_in * 1000;
  return accessToken;
}

async function sget<T>(url: string, params?: Record<string, any>): Promise<T> {
  const token = await getAccessToken();
  const { data } = await axios.get(url, {
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return data as T;
}

export async function searchArtistByName(name: string) {
  return sget<{ artists: { items: any[] } }>("/search", {
    q: name, type: "artist", limit: 1,
  });
}

export async function getArtist(artistId: string) {
  return sget(`/artists/${artistId}`);
}

export async function getArtistAlbums(artistId: string) {
  // Include albums & singles; you can add "appears_on,compilation" if you want more
  return sget<{ items: any[] }>(`/artists/${artistId}/albums`, {
    include_groups: "album,single",
    market: "US",
    limit: 24,
  });
}
