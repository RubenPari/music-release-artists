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

export const config = {
  databaseUrl: () => required("DATABASE_URL"),
  spotifyClientId: () => required("SPOTIFY_CLIENT_ID"),
  spotifyClientSecret: () => required("SPOTIFY_CLIENT_SECRET"),
  sessionSecret: () => required("SESSION_SECRET"),
  tokenEncryptionKey: () => required("TOKEN_ENCRYPTION_KEY"),
  appBaseUrl: () => optional("APP_BASE_URL", "http://localhost:4000"),
  frontendOrigin: () => optional("FRONTEND_ORIGIN", "http://localhost:4200"),
  smtpHost: () => optional("SMTP_HOST", "localhost"),
  smtpPort: () => Number(optional("SMTP_PORT", "1025")),
  smtpUser: () => process.env.SMTP_USER || "",
  smtpPass: () => process.env.SMTP_PASS || "",
  smtpFrom: () => optional("SMTP_FROM", "noreply@music-release.local"),
  releaseWindowDays: () => Number(optional("RELEASE_WINDOW_DAYS", "90")),
  sessionCookieName: "mra_session",
  sessionTtlDays: 30,
};

export function spotifyRedirectUri(): string {
  return `${config.appBaseUrl()}/auth/spotify/callback`;
}
