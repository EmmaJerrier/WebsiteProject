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
  await connectToMongo();
  app.use(cors());
  app.use(express.json());

  // If a `public` directory exists (populated with the frontend `dist` build),
  // serve it as static files. This lets App Engine serve the SPA from the same
  // service as the API.
  const publicPath = path.join(__dirname, "..", "public");
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    // Serve index.html for client-side routes
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(publicPath, "index.html"));
    });
  }

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", message: "Backend is running" });
  });

  app.use("/api/events", eventsRouter);
  app.use("/api/favorites", favoritesRouter);
  app.use("/api/spotify", spotifyRouter);

  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
