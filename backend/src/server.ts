import dotenv from "dotenv";
dotenv.config(); // must come first

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import eventsRouter from "./routes/events";
import favoritesRouter from "./routes/favorites";
import { connectToMongo } from "./db/mongo";
import spotifyRouter from "./routes/spotify";
import { loadSecrets } from "./secrets";

const app = express();
const PORT = process.env.PORT || 8080;

// ----------------------
// 🔥 FIX CORS / PREFLIGHT
// ----------------------
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});


// You can still use cors() but it's no longer critical
app.use(cors());
// Parse JSON bodies
app.use(express.json());

async function start() {
  const projectId =
    process.env.GCP_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT;

  await loadSecrets(projectId);

  const dbConnected = await connectToMongo();
  if (!dbConnected) {
    console.warn(
      "⚠️  Backend started without DB connection — DB routes will return errors until connection is restored."
    );
  }

  // Serve frontend (if built into /public)
  const publicPath = path.join(__dirname, "..", "public");
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", message: "Backend is running" });
  });

  app.use("/api/events", eventsRouter);
  app.use("/api/favorites", favoritesRouter);
  app.use("/api/spotify", spotifyRouter);

  // SPA fallback for non-API routes
  if (fs.existsSync(publicPath)) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== "GET") return next();
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(publicPath, "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
