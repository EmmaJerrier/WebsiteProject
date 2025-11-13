import { Router } from "express";
import { searchArtistByName, getArtist, getArtistAlbums } from "../services/spotify";

const r = Router();

// GET /api/spotify/lookup?name=Taylor%20Swift
r.get("/lookup", async (req, res) => {
  try {
    const name = String(req.query.name || "").trim();
    if (!name) return res.status(400).json({ error: "name is required" });
    const data = await searchArtistByName(name);
    const artist = data.artists.items?.[0] || null;
    res.json({ artist });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "spotify lookup failed" });
  }
});

// GET /api/spotify/artist/:id
r.get("/artist/:id", async (req, res) => {
  try {
    const data = await getArtist(req.params.id);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message || "spotify artist failed" });
  }
});

// GET /api/spotify/artist/:id/albums
r.get("/artist/:id/albums", async (req, res) => {
  try {
    const data = await getArtistAlbums(req.params.id);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message || "spotify albums failed" });
  }
});

export default r;
