import dotenv from "dotenv";
dotenv.config();        // ← this must come first

import express, { Request, Response } from "express";
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


async function start() {
  // In production we'll prefer loading from Secret Manager; load if project id present
  const projectId = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  await loadSecrets(projectId);

  // Connect to MongoDB (requires MONGODB_URI to be set either via .env for local dev or Secrets in prod)
  // `connectToMongo` now returns a boolean and does not exit the process on
  // failure. We still attempt to connect, but continue starting the HTTP
  // server so the SPA can be served even if the DB is unreachable.
  const dbConnected = await connectToMongo();
  if (!dbConnected) {
    console.warn("⚠️  Backend started without DB connection — DB routes will return errors until connection is restored.");
  }
  app.use(cors());
  app.use(express.json());

  // If a `public` directory exists (populated with the frontend `dist` build),
  // serve it as static files. This lets App Engine serve the SPA from the same
  // service as the API.
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

  // SPA fallback: serve index.html for all non-API GET routes. Place this
  // after the API routes so it doesn't intercept API requests (which are
  // mounted under /api/*).
  if (fs.existsSync(publicPath)) {
    // Safe SPA fallback: for any non-API GET request, serve index.html.
    // We use a middleware instead of an express route with a wildcard
    // pattern to avoid path-to-regexp parsing issues across express/path-to-regexp versions.
    app.use((req: Request, res: Response, next) => {
      if (req.method !== "GET") return next();
      // skip API routes
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
