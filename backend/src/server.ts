import dotenv from "dotenv";
dotenv.config();        // ← this must come first

import express, { Request, Response } from "express";
import cors from "cors";
import eventsRouter from "./routes/events";
import "./db/mongo";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "Backend is running" });
});

app.use("/api/events", eventsRouter);

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
