import { Router } from "express";
import Favorite from "../models/Favorite";

const router = Router();

// GET /api/favorites
router.get("/", async (_req, res) => {
  try {
    const favorites = await Favorite.find().sort({ addedAt: -1 });
    res.json(favorites);
  } catch (err) {
    console.error("Error fetching favorites:", err);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

// POST /api/favorites
// Expect body: { eventId, name, date, time, venue, genre, imageUrl }
router.post("/", async (req, res) => {
  const { eventId, name, date, time, venue, genre, imageUrl } = req.body;

  if (!eventId || !name) {
    return res.status(400).json({ error: "eventId and name are required" });
  }

  try {
    const fav = await Favorite.findOneAndUpdate(
      { eventId },
      { eventId, name, date, time, venue, genre, imageUrl, addedAt: new Date() },
      { upsert: true, new: true }
    );
    res.status(201).json(fav);
  } catch (err) {
    console.error("Error saving favorite:", err);
    res.status(500).json({ error: "Failed to save favorite" });
  }
});

// DELETE /api/favorites/:eventId
router.delete("/:eventId", async (req, res) => {
  const { eventId } = req.params;

  try {
    await Favorite.findOneAndDelete({ eventId });
    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting favorite:", err);
    res.status(500).json({ error: "Failed to delete favorite" });
  }
});

export default router;
