import axios from "axios";

const TM_BASE = "https://app.ticketmaster.com/discovery/v2";

function getApiKey(): string {
  const key = process.env.TM_API_KEY;
  if (!key) {
    throw new Error("TM_API_KEY is not set in environment. For local development, add it to backend/.env or set TM_API_KEY in your shell.");
  }
  return key;
}
export async function getEventDetails(id: string) {
  const response = await axios.get(`${TM_BASE}/events/${id}.json`, {
    params: {
      apikey: getApiKey()
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
      apikey: getApiKey(),
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
    const url = "https://app.ticketmaster.com/discovery/v2/suggest";
    const res = await axios.get(url, {
      params: { apikey: getApiKey(), keyword: q },
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


