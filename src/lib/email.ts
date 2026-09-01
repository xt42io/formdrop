import { Resend } from "resend";

let client: Resend | null = null;

// Created on first send rather than at import time — a missing key should fail
// the one request that needs email, not every page that imports auth.
export function getResend() {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY is not set, so no email could be sent. Add it to your .env file.",
      );
    }

    client = new Resend(apiKey);
  }

  return client;
}
