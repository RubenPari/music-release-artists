function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

function boundedPositiveInteger(
  name: string,
  fallback: number,
  maximum: number,
): number {
  const value = Number(optional(name, String(fallback)));
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return Math.min(value, maximum);
}

export const config = {
  databaseUrl: () => required("DATABASE_URL"),
  databaseSslCaPath: () => process.env.DATABASE_SSL_CA_PATH || "",
  databasePoolMax: () => boundedPositiveInteger("DATABASE_POOL_MAX", 8, 8),
  spotifyClientId: () => required("SPOTIFY_CLIENT_ID"),
  spotifyClientSecret: () => required("SPOTIFY_CLIENT_SECRET"),
  sessionSecret: () => required("SESSION_SECRET"),
  tokenEncryptionKey: () => required("TOKEN_ENCRYPTION_KEY"),
  appBaseUrl: () => optional("APP_BASE_URL", "http://localhost:4000"),
  frontendOrigin: () => optional("FRONTEND_ORIGIN", "http://127.0.0.1:4200"),
  brevoApiKey: () => required("BREVO_API_KEY"),
  brevoSenderEmail: () => required("BREVO_SENDER_EMAIL"),
  brevoSenderName: () => optional("BREVO_SENDER_NAME", "Uscite"),
  releaseWindowDays: () => Number(optional("RELEASE_WINDOW_DAYS", "90")),
  sessionCookieName: "mra_session",
  sessionTtlDays: 30,
};

export function spotifyRedirectUri(): string {
  return `${config.appBaseUrl()}/auth/spotify/callback`;
}
