import { afterEach, describe, expect, it } from "vitest";
import { config } from "./config";

const originalEmailEnabled = process.env.EMAIL_ENABLED;
const originalBrevoApiKey = process.env.BREVO_API_KEY;
const originalBrevoSenderEmail = process.env.BREVO_SENDER_EMAIL;

afterEach(() => {
  restore("EMAIL_ENABLED", originalEmailEnabled);
  restore("BREVO_API_KEY", originalBrevoApiKey);
  restore("BREVO_SENDER_EMAIL", originalBrevoSenderEmail);
});

describe("email configuration", () => {
  it("does not require Brevo credentials when email is disabled", () => {
    process.env.EMAIL_ENABLED = "false";
    delete process.env.BREVO_API_KEY;
    delete process.env.BREVO_SENDER_EMAIL;

    expect(config.emailEnabled()).toBe(false);
    expect(config.brevoApiKey()).toBe("");
    expect(config.brevoSenderEmail()).toBe("");
  });

  it("requires Brevo credentials when email is enabled", () => {
    process.env.EMAIL_ENABLED = "true";
    delete process.env.BREVO_API_KEY;
    delete process.env.BREVO_SENDER_EMAIL;

    expect(() => config.brevoApiKey()).toThrow(
      "Missing required environment variable: BREVO_API_KEY",
    );
    expect(() => config.brevoSenderEmail()).toThrow(
      "Missing required environment variable: BREVO_SENDER_EMAIL",
    );
  });

  it("rejects invalid flag values", () => {
    process.env.EMAIL_ENABLED = "disabled";

    expect(() => config.emailEnabled()).toThrow(
      "EMAIL_ENABLED must be true, false, 1, or 0",
    );
  });
});

function restore(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
