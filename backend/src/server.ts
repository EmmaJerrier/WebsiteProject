import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
