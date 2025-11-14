import { Router } from "express";
import { searchEvents, getEventDetails, suggestKeywords } from "../services/ticketmaster";

const router = Router();

// GET /api/events/suggest?keyword=...
router.get("/suggest", async (req, res) => {
  try {
    const keyword = String(req.query.keyword || "").trim();
    if (!keyword) {
      return res.json({ _embedded: { attractions: [], venues: [] } });
    }
    const data = await suggestKeywords(keyword);
    return res.json(data);
  } catch (e: any) {
    console.error("Suggest route error:", e.message || e);
    // return safe empty shape
    return res.json({ _embedded: { attractions: [], venues: [] } });
  }
});

// GET /api/events/search?keyword=...&radius=...&lat=...&lng=...&segmentId=...
router.get("/search", async (req, res) => {
  try {
    const { keyword, radius, lat, lng, segmentId } = req.query;

    if (!keyword || !radius || !lat || !lng) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const data = await searchEvents({
      keyword: String(keyword),
      radius: String(radius),
      lat: Number(lat),
      lng: Number(lng),
      segmentId: segmentId ? String(segmentId) : undefined
    });

    res.json(data);
  } catch (err) {
    console.error("Error in /api/events/search:", err);
    res.status(500).json({ error: "Ticketmaster search failed" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = await getEventDetails(id);
    res.json(data);
  } catch (err) {
    console.error("Error in /api/events/:id:", err);
    res.status(500).json({ error: "Ticketmaster event details failed" });
  }
});

router.get("/suggest", async (req, res) => {
  const { keyword } = req.query;
  if (!keyword || !String(keyword).trim()) return res.json({ _embedded: { attractions: [] }});
  const data = await suggestKeywords(String(keyword));
  res.json(data);
});


export default router;
