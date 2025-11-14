import axios from "axios";

// Resolve API base URL with this order of precedence:
// 1) VITE_API_BASE_URL (set in .env or build-time)
// 2) Same-origin in browser: window.location.origin + "/api"
// 3) Fallback to "/api" (useful when proxied in dev)
const resolvedBase =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" && window.location?.origin
    ? `${window.location.origin}/api`
    : "/api");

const api = axios.create({ baseURL: resolvedBase });

export default api;
