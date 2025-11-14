import axios from "axios";

const TM_BASE = "https://app.ticketmaster.com/discovery/v2";
const TM_API_KEY = process.env.TM_API_KEY;

if (!TM_API_KEY) {
  throw new Error("TM_API_KEY is not set in .env");
}
export async function getEventDetails(id: string) {
  const response = await axios.get(`${TM_BASE}/events/${id}.json`, {
    params: {
      apikey: TM_API_KEY
    }
  });

  return response.data;
}

export async function searchEvents(params: {
  keyword: string;
  radius: string;
  lat: number;
  lng: number;
  segmentId?: string;
}) {
  const { keyword, radius, lat, lng, segmentId } = params;

  // Ticketmaster expects a geoPoint from lat/lng, but to keep it simple
  // at first we can just pass latlong param; you can switch to geohash later.
  const response = await axios.get(`${TM_BASE}/events.json`, {
    params: {
      apikey: TM_API_KEY,
      keyword,
      radius,
      unit: "miles",
      latlong: `${lat},${lng}`,
      ...(segmentId ? { segmentId } : {})
    }
  });

  return response.data;
}

export async function suggestKeywords(q: string): Promise<any> {
  try {
    const apiKey = process.env.TM_API_KEY;
    const url = "https://app.ticketmaster.com/discovery/v2/suggest";
    const res = await axios.get(url, {
      params: { apikey: apiKey, keyword: q },
    });

    // Return the raw TM suggest response so the frontend can read _embedded.attractions/venues
    return res.data;
  } catch (err: any) {
    if (axios.isAxiosError(err) && err.response?.status === 429) {
      console.warn("Ticketmaster rate limit (429) on suggest; returning empty embedded lists");
      return { _embedded: { attractions: [], venues: [] } };
    }
    console.error("Error in suggestKeywords:", err?.message ?? err);
    // Return a safe empty shape so frontend doesn't error
    return { _embedded: { attractions: [], venues: [] } };
  }
}


