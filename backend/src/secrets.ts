import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const client = new SecretManagerServiceClient();

async function accessSecret(name: string) {
  const [version] = await client.accessSecretVersion({ name });
  const payload = version.payload?.data?.toString("utf8");
  return payload ?? "";
}

export async function loadSecrets(projectId?: string) {
  // Determine project id from env or parameter
  const proj = projectId || process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  if (!proj) {
    // No project id — probably running locally. Caller should use .env in that case.
    return;
  }

  const secretNames = ["MONGODB_URI", "TM_API_KEY", "SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET"];

  for (const s of secretNames) {
    if (!process.env[s]) {
      try {
        const fullName = `projects/${proj}/secrets/${s}/versions/latest`;
        const value = await accessSecret(fullName);
        if (value) process.env[s] = value;
      } catch (err) {
        // Don't fail hard; missing secrets may be optional in some envs
        console.warn(`Could not load secret ${s} from Secret Manager:`, err?.message ?? err);
      }
    }
  }
}

export async function accessSecretVersion(fullName: string) {
  return accessSecret(fullName);
}
