import { config } from "../lib/config";
import { signUnsubscribe } from "../lib/crypto";

export interface ReleaseEmailItem {
  title: string;
  artists: string;
  releaseType: string;
  releaseDate: string;
  spotifyUrl: string;
}

async function sendEmail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": config.brevoApiKey(),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: config.brevoSenderName(),
        email: config.brevoSenderEmail(),
      },
      to: [{ email: message.to }],
      subject: message.subject,
      htmlContent: message.html,
      textContent: message.text,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Brevo email error ${response.status}: ${details.slice(0, 1000)}`,
    );
  }
}

function unsubscribeUrl(userId: string): string {
  const token = signUnsubscribe(userId);
  return `${config.appBaseUrl()}/notifications/unsubscribe?token=${encodeURIComponent(token)}`;
}

function typeLabel(t: string): string {
  if (t === "album") return "Album";
  if (t === "ep") return "EP";
  return "Single";
}

export async function sendPerReleaseEmail(
  userId: string,
  to: string,
  item: ReleaseEmailItem,
): Promise<void> {
  const unsub = unsubscribeUrl(userId);
  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px;">
      <h1 style="font-size: 22px;">Nuova uscita</h1>
      <p><strong>${escapeHtml(item.title)}</strong> — ${escapeHtml(item.artists)}</p>
      <p>${typeLabel(item.releaseType)} · ${escapeHtml(item.releaseDate)}</p>
      <p><a href="${item.spotifyUrl}">Apri su Spotify</a></p>
      <hr />
      <p style="font-size: 12px; color: #666;">
        <a href="${unsub}">Disattiva le notifiche</a>
      </p>
    </div>
  `;
  await sendEmail({
    to,
    subject: `Nuova uscita: ${item.title}`,
    html,
    text: `Nuova uscita: ${item.title} — ${item.artists}\n${item.spotifyUrl}\n\nDisattiva: ${unsub}`,
  });
}

export async function sendDigestEmail(
  userId: string,
  to: string,
  items: ReleaseEmailItem[],
): Promise<void> {
  const unsub = unsubscribeUrl(userId);
  const list = items
    .map(
      (i) =>
        `<li><strong>${escapeHtml(i.title)}</strong> — ${escapeHtml(i.artists)} (${typeLabel(i.releaseType)}, ${escapeHtml(i.releaseDate)}) — <a href="${i.spotifyUrl}">Spotify</a></li>`,
    )
    .join("");
  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px;">
      <h1 style="font-size: 22px;">Digest uscite del giorno</h1>
      <p>${items.length} nuove uscite dai tuoi artisti:</p>
      <ul>${list}</ul>
      <hr />
      <p style="font-size: 12px; color: #666;">
        <a href="${unsub}">Disattiva le notifiche</a>
      </p>
    </div>
  `;
  await sendEmail({
    to,
    subject: `Digest: ${items.length} nuove uscite`,
    html,
    text: items
      .map((i) => `${i.title} — ${i.artists} — ${i.spotifyUrl}`)
      .join("\n")
      .concat(`\n\nDisattiva: ${unsub}`),
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
