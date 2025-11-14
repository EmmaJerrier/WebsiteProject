import mongoose from "mongoose";

// Attempt to connect to MongoDB. This function will not exit the process on
// failure so the service can still start and serve the static SPA even when
// the database is temporarily unavailable (useful for App Engine deployments
// where network restrictions may block Atlas access). It returns `true` if
// connected, `false` otherwise.
export async function connectToMongo(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn("⚠️  MONGODB_URI is not set in environment — running without DB");
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB Atlas");
    return true;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    // Don't exit the process. Return false so the caller can decide how to
    // proceed (for example, start the HTTP server and surface DB errors on
    // API routes).
    return false;
  }
}
