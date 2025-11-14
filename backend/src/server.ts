import dotenv from "dotenv";
dotenv.config();        // ← this must come first

import express, { Request, Response } from "express";
import cors from "cors";
import eventsRouter from "./routes/events";
import favoritesRouter from "./routes/favorites";
import "./db/mongo";
import spotifyRouter from "./routes/spotify";
import mongoose from "mongoose";

const app = express();
const PORT = process.env.PORT || 8080;


const mongoUri = process.env.MONGODB_URI!;
mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "Backend is running" });
});

app.use("/api/events", eventsRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/spotify", spotifyRouter);

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
