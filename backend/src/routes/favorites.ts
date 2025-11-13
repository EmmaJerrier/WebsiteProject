// src/routes/favorites.ts
import { Router } from "express";

const router = Router();

// In-memory store for now; swap with DB later
let favorites: any[] = [];

router.get("/", (_req, res) => {
  res.json(favorites);
});

router.post("/", (req, res) => {
  const ev = req.body;
  if (!ev?.id) return res.status(400).json({ error: "id required" });

  favorites = favorites.filter((e) => e.id !== ev.id).concat(ev);
  res.status(201).json(ev);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  favorites = favorites.filter((e) => e.id !== id);
  res.status(204).end();
});

export default router;
